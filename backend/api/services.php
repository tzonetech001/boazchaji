<?php
require_once '../config/db.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // POST itatumika kuongeza huduma mpya
    $agent_id = $_POST['agent_id'] ?? null;
    $customer_id = $_POST['customer_id'] ?? null;
    $device_type_id = $_POST['device_type_id'] ?? null;
    $device_name = $_POST['device_name'] ?? '';
    $quantity = $_POST['quantity'] ?? 1;
    $amount = $_POST['amount'] ?? 300.00;
    $status = isset($_POST['status']) && $_POST['status'] === 'paid' ? 'paid' : 'pending';
    
    $image_path = null;
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $newFileName = uniqid('device_') . '.' . $ext;
        if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $newFileName)) {
            $image_path = 'uploads/' . $newFileName;
        }
    }
    
    $query = "INSERT INTO services (agent_id, customer_id, device_type_id, device_name, quantity, amount, image_path, status, taken) 
              VALUES (:agent_id, :customer_id, :device_type_id, :device_name, :quantity, :amount, :image_path, :status, 0)";
    $stmt = $conn->prepare($query);
    
    try {
        $stmt->execute([
            ':agent_id' => $agent_id, ':customer_id' => $customer_id, ':device_type_id' => $device_type_id,
            ':device_name' => $device_name, ':quantity' => $quantity, ':amount' => $amount, 
            ':image_path' => $image_path, ':status' => $status
        ]);
        
        // Tuma Notification kwa Admin
        $agentName = $conn->query("SELECT first_name, last_name FROM users WHERE id = $agent_id")->fetch(PDO::FETCH_ASSOC);
        $agentName = $agentName ? $agentName['first_name'] . ' ' . $agentName['last_name'] : 'Agent';
        $conn->query("INSERT INTO notifications (sender_id, title, message) VALUES ($agent_id, 'Huduma Mpya', 'Agent $agentName ameongeza huduma mpya ya $device_name')");

        echo json_encode(["message" => "Huduma imehifadhiwa"]);
    } catch(PDOException $e) {
        http_response_code(500); echo json_encode(["message" => "Hitilafu: " . $e->getMessage()]);
    }
} 
elseif ($method === 'GET') {
    $role = $_GET['role'] ?? 'agent';
    $agent_id = $_GET['agent_id'] ?? null;
    $status = $_GET['status'] ?? 'pending'; // pending, paid, history
    $search = $_GET['search'] ?? '';

    $query = "SELECT s.*, c.name as customer_name, c.phone as customer_phone, 
                     u.first_name as agent_name, dt.name as device_type_name 
              FROM services s
              JOIN customers c ON s.customer_id = c.id
              JOIN users u ON s.agent_id = u.id
              JOIN device_types dt ON s.device_type_id = dt.id
              WHERE 1=1";

    if ($status === 'history') {
        $query .= " AND s.status = 'paid' AND s.taken = 1";
    } elseif ($status === 'pending') {
        $query .= " AND (s.status = 'pending' OR (s.status = 'paid' AND s.taken = 0))";
    } else {
        $query .= " AND s.status = :status";
    }

    if ($role === 'agent' && $agent_id) {
        $query .= " AND s.agent_id = :agent_id";
    }
    if ($search) {
        $query .= " AND (c.name LIKE :search OR c.phone LIKE :search OR s.device_name LIKE :search)";
    }
    
    $query .= " ORDER BY s.created_at DESC";
    $stmt = $conn->prepare($query);
    
    if ($status !== 'history' && $status !== 'pending') $stmt->bindParam(':status', $status);
    if ($role === 'agent' && $agent_id) $stmt->bindParam(':agent_id', $agent_id);
    if ($search) $stmt->bindValue(':search', "%$search%");
    
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} 
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    if (empty($data->id) || empty($data->action)) exit();

    if ($data->action === 'update_status') {
        $query = "UPDATE services SET status = :status WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([':status' => $data->status, ':id' => $data->id]);
        echo json_encode(["message" => "Hali imebadilishwa"]);
    } elseif ($data->action === 'take_device') {
        $query = "UPDATE services SET taken = 1 WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([':id' => $data->id]);
        echo json_encode(["message" => "Kifaa kimechukuliwa"]);
    }
}
elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    $query = "SELECT status, taken FROM services WHERE id = :id";
    $stmt = $conn->prepare($query);
    $stmt->execute([':id' => $id]);
    $service = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($service['status'] === 'paid' && $service['taken'] == 1) {
        $del = $conn->prepare("DELETE FROM services WHERE id = :id");
        $del->execute([':id' => $id]);
        echo json_encode(["message" => "Imefutwa"]);
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Hauwezi kufuta huduma ambayo haijalipiwa au haijachukuliwa!"]);
    }
}
?>