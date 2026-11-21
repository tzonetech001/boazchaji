<?php
require_once '../config/db.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->query("SELECT * FROM device_types ORDER BY name ASC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if (empty($data->name)) { http_response_code(400); echo json_encode(["message" => "Jina linahitajika"]); exit(); }
    
    $stmt = $conn->prepare("INSERT INTO device_types (name) VALUES (:name)");
    try {
        $stmt->execute([':name' => $data->name]);
        echo json_encode(["message" => "Aina imeongezwa", "id" => $conn->lastInsertId()]);
    } catch(PDOException $e) {
        http_response_code(500); echo json_encode(["message" => "Hitilafu au imeshawekwa"]);
    }
}
?>