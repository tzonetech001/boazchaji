<?php
require_once '../config/db.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $agent_id = $_POST['agent_id'] ?? null;
    $customer_id = $_POST['customer_id'] ?? null;
    $device_type_id = $_POST['device_type_id'] ?? null;
    $device_name = $_POST['device_name'] ?? '';
    $quantity = $_POST['quantity'] ?? 1;
    $amount = $_POST['amount'] ?? 300.00;
    $status = isset($_POST['status']) && $_POST['status'] === 'paid' ? 'paid' : 'pending';
    
    $images = [];
    if (isset($_FILES['images']) && !empty($_FILES['images']['name'][0])) {
        $uploadDir = __DIR__ . '/../uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        
        foreach ($_FILES['images']['tmp_name'] as $key => $tmp_name) {
            $file_name = $_FILES['images']['name'][$key];
            $file_size = $_FILES['images']['size'][$key];
            $file_tmp = $_FILES['images']['tmp_name'][$key];
            
            if ($file_size > 0) {
                $ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
                $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                if (in_array($ext, $allowed)) {
                    $newFileName = uniqid('device_') . '.' . $ext;
                    if (move_uploaded_file($file_tmp, $uploadDir . $newFileName)) {
                        $images[] = 'uploads/' . $newFileName;
                    }
                }
            }
        }
    }
    $image_path = count($images) > 0 ? json_encode($images) : null;
    
    $query = "INSERT INTO services (agent_id, customer_id, device_type_id, device_name, quantity, amount, image_path, status, taken, taken_quantity) 
              VALUES (:agent_id, :customer_id, :device_type_id, :device_name, :quantity, :amount, :image_path, :status, 0, 0)";
    $stmt = $conn->prepare($query);
    
    try {
        $stmt->execute([
            ':agent_id' => $agent_id, ':customer_id' => $customer_id, ':device_type_id' => $device_type_id,
            ':device_name' => $device_name, ':quantity' => $quantity, ':amount' => $amount, 
            ':image_path' => $image_path, ':status' => $status
        ]);
        
        $agentName = $conn->query("SELECT first_name, last_name FROM users WHERE id = $agent_id")->fetch(PDO::FETCH_ASSOC);
        $agentName = $agentName ? $agentName['first_name'] . ' ' . $agentName['last_name'] : 'Agent';
        $conn->query("INSERT INTO notifications (sender_id, title, message) VALUES ($agent_id, 'Huduma Mpya', 'Agent $agentName ameongeza huduma ya $device_name')");

        echo json_encode(["message" => "Huduma imehifadhiwa"]);
    } catch(PDOException $e) {
        http_response_code(500); echo json_encode(["message" => "Hitilafu: " . $e->getMessage()]);
    }
} 
elseif ($method === 'GET') {
    $role = $_GET['role'] ?? 'agent';
    $agent_id = $_GET['agent_id'] ?? null;
    $status = $_GET['status'] ?? 'pending';
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

    if ($role === 'agent' && $agent_id) $query .= " AND s.agent_id = :agent_id";
    if ($search) $query .= " AND (c.name LIKE :search OR c.phone LIKE :search OR s.device_name LIKE :search)";
    
    $query .= " ORDER BY s.created_at DESC";
    $stmt = $conn->prepare($query);
    
    if ($status !== 'history' && $status !== 'pending') $stmt->bindParam(':status', $status);
    if ($role === 'agent' && $agent_id) $stmt->bindParam(':agent_id', $agent_id);
    if ($search) $stmt->bindValue(':search', "%$search%");
    
    $stmt->execute();
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Decode JSON images
    foreach ($services as &$s) {
        $s['images'] = $s['image_path'] ? json_decode($s['image_path'], true) : [];
    }
    echo json_encode($services);

} 
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    if (empty($data->id) || empty($data->action)) exit();

    if ($data->action === 'update_status') {
        $stmt = $conn->prepare("UPDATE services SET status = :status WHERE id = :id");
        $stmt->execute([':status' => $data->status, ':id' => $data->id]);
        echo json_encode(["message" => "Hali imebadilishwa"]);
    } 
    elseif ($data->action === 'return_quantity') {
        // Pata taarifa za sasa
        $stmt = $conn->prepare("SELECT quantity, taken_quantity FROM services WHERE id = :id");
        $stmt->execute([':id' => $data->id]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $newTakenQty = $service['taken_quantity'] + $data->return_qty;
        $isFullyTaken = ($newTakenQty >= $service['quantity']) ? 1 : 0;

        $stmt = $conn->prepare("UPDATE services SET taken_quantity = :tq, taken = :taken WHERE id = :id");
        $stmt->execute([':tq' => $newTakenQty, ':taken' => $isFullyTaken, ':id' => $data->id]);
        
        $msg = $isFullyTaken ? "Vifaa vyote vimechukuliwa na huduma imehamia historia" : "Kifaa kimoja kimechukuliwa. Bado vipo kwenye list";
        echo json_encode(["message" => $msg]);
    }
}
elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    $stmt = $conn->prepare("SELECT taken_quantity FROM services WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $service = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($service && $service['taken_quantity'] > 0) {
        http_response_code(400);
        echo json_encode(["message" => "Hauwezi kufuta huduma ambayo kifaa chake kimeshaanza kuchukuliwa!"]);
        exit();
    }

    $del = $conn->prepare("DELETE FROM services WHERE id = :id");
    $del->execute([':id' => $id]);
    echo json_encode(["message" => "Huduma imefutwa"]);
}
?>