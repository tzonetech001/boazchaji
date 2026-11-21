<?php
// backend/api/services.php
require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // ... (Kodi ya awali ya kuweka huduma mpya ibaki vile vile) ...
    $agent_id = $_POST['agent_id'] ?? null;
    $customer_id = $_POST['customer_id'] ?? null;
    $device_type_id = $_POST['device_type_id'] ?? null;
    $device_name = $_POST['device_name'] ?? '';
    $quantity = $_POST['quantity'] ?? 1;
    $amount = $_POST['amount'] ?? 300.00;
    
    $image_path = null;
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        $fileExtension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $newFileName = uniqid('device_') . '.' . $fileExtension;
        $targetFile = $uploadDir . $newFileName;
        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
            $image_path = 'uploads/' . $newFileName;
        }
    }
    
    $query = "INSERT INTO services (agent_id, customer_id, device_type_id, device_name, quantity, amount, image_path, status) 
              VALUES (:agent_id, :customer_id, :device_type_id, :device_name, :quantity, :amount, :image_path, 'pending')";
    $stmt = $conn->prepare($query);
    
    try {
        $stmt->execute([
            ':agent_id' => $agent_id, ':customer_id' => $customer_id, ':device_type_id' => $device_type_id,
            ':device_name' => $device_name, ':quantity' => $quantity, ':amount' => $amount, ':image_path' => $image_path
        ]);
        http_response_code(201);
        echo json_encode(["message" => "Huduma imerekodiwa kikamilifu"]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Hitilafu: " . $e->getMessage()]);
    }
} 
elseif ($method === 'GET') {
    // Kupata orodha ya huduma (Pending au Paid) kwa agent au admin
    $status = isset($_GET['status']) ? $_GET['status'] : 'pending';
    $role = isset($_GET['role']) ? $_GET['role'] : 'agent';
    $agent_id = isset($_GET['agent_id']) ? $_GET['agent_id'] : null;

    // Query ya msingi inaunganisha tables zote
    $query = "SELECT s.*, c.name as customer_name, c.phone as customer_phone, 
                     u.first_name as agent_name, dt.name as device_type_name 
              FROM services s
              JOIN customers c ON s.customer_id = c.id
              JOIN users u ON s.agent_id = u.id
              JOIN device_types dt ON s.device_type_id = dt.id
              WHERE s.status = :status";

    // Kama ni agent, mpe data zake tu. Kama ni admin, mpe zote.
    if ($role === 'agent' && $agent_id) {
        $query .= " AND s.agent_id = :agent_id";
    }
    
    $query .= " ORDER BY s.created_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':status', $status);
    if ($role === 'agent' && $agent_id) {
        $stmt->bindParam(':agent_id', $agent_id);
    }
    $stmt->execute();
    
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($services);

} 
elseif ($method === 'PUT') {
    // Kubadilisha status kuwa PAID (Amelipa)
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->id)) {
        http_response_code(400);
        echo json_encode(["message" => "ID ya huduma inahitajika"]);
        exit();
    }

    $query = "UPDATE services SET status = 'paid' WHERE id = :id";
    $stmt = $conn->prepare($query);
    
    try {
        $stmt->execute([':id' => $data->id]);
        echo json_encode(["message" => "Huduma imewekwa kama Amelipa"]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Hitilafu: " . $e->getMessage()]);
    }
}
?>