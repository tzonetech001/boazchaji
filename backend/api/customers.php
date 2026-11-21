<?php
// backend/api/customers.php
require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Search customer by name
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    
    $query = "SELECT * FROM customers WHERE name LIKE :search ORDER BY name ASC LIMIT 10";
    $stmt = $conn->prepare($query);
    $stmt->execute([':search' => "%$search%"]);
    
    $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($customers);
    
} elseif ($method === 'POST') {
    // Add new customer
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->name)) {
        http_response_code(400);
        echo json_encode(["message" => "Jina la mteja linahitajika"]);
        exit();
    }
    
    $query = "INSERT INTO customers (name, phone) VALUES (:name, :phone)";
    $stmt = $conn->prepare($query);
    
    try {
        $stmt->execute([
            ':name' => $data->name,
            ':phone' => $data->phone ?? ''
        ]);
        echo json_encode(["message" => "Mteja ameongezwa", "id" => $conn->lastInsertId()]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Hitilafu: " . $e->getMessage()]);
    }
}
?>