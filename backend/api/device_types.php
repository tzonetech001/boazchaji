<?php
require_once '../config/db.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->query("SELECT * FROM device_types ORDER BY name ASC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} 
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if (empty($data->name)) { 
        http_response_code(400); 
        echo json_encode(["message" => "Jina linahitajika"]); 
        exit(); 
    }
    
    $stmt = $conn->prepare("INSERT INTO device_types (name) VALUES (:name)");
    try {
        $stmt->execute([':name' => $data->name]);
        echo json_encode(["message" => "Aina imeongezwa", "id" => $conn->lastInsertId()]);
    } catch(PDOException $e) {
        http_response_code(500); 
        echo json_encode(["message" => "Aina hii imeshawekwa au kuna hitilafu."]);
    }
}
elseif ($method === 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["message" => "ID inahitajika"]);
        exit();
    }

    // Kagua kama aina hii ya kifaa imetumika kwenye table ya services
    $check = $conn->prepare("SELECT COUNT(id) as count FROM services WHERE device_type_id = :id");
    $check->execute([':id' => $id]);
    $result = $check->fetch(PDO::FETCH_ASSOC);

    if ($result['count'] > 0) {
        http_response_code(400);
        echo json_encode(["message" => "Aina hii ya kifaa imetumika kwenye huduma. Hauwezi kuifuta!"]);
        exit();
    }

    $del = $conn->prepare("DELETE FROM device_types WHERE id = :id");
    $del->execute([':id' => $id]);
    echo json_encode(["message" => "Aina ya kifaa imefutwa."]);
}
?>