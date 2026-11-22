<?php
// backend/api/customers.php
require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $role = isset($_GET['role']) ? $_GET['role'] : 'agent';
    $agent_id = isset($_GET['agent_id']) ? $_GET['agent_id'] : null;
    
    // Tunachukua pia jina la Agent aliyemsajili mteja
    $query = "SELECT c.*, u.first_name as agent_first_name, u.last_name as agent_last_name 
              FROM customers c 
              LEFT JOIN users u ON c.created_by_agent_id = u.id 
              WHERE c.name LIKE :search";
    
    // Kama ni agent, mpe data zake tu. Kama ni admin, mpe zote.
    if ($role === 'agent' && $agent_id) {
        $query .= " AND c.created_by_agent_id = :agent_id";
    }
    
    $query .= " ORDER BY c.name ASC LIMIT 100";
    
    $stmt = $conn->prepare($query);
    $stmt->bindValue(':search', "%$search%");
    if ($role === 'agent' && $agent_id) {
        $stmt->bindValue(':agent_id', $agent_id);
    }
    $stmt->execute();
    
    $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($customers);
    
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->name)) {
        http_response_code(400);
        echo json_encode(["message" => "Jina la mteja linahitajika"]);
        exit();
    }
    
    $query = "INSERT INTO customers (name, phone, created_by_agent_id) VALUES (:name, :phone, :agent_id)";
    $stmt = $conn->prepare($query);
    
    try {
        $stmt->execute([
            ':name' => $data->name,
            ':phone' => $data->phone ?? '',
            ':agent_id' => $data->created_by_agent_id ?? null
        ]);
        echo json_encode(["message" => "Mteja ameongezwa", "id" => $conn->lastInsertId()]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Hitilafu: " . $e->getMessage()]);
    }
} 
elseif ($method === 'PUT') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    $data = json_decode(file_get_contents("php://input"));
    
    if (!$id || empty($data->name)) {
        http_response_code(400);
        echo json_encode(["message" => "Data haijakamilika"]);
        exit();
    }
    
    $query = "UPDATE customers SET name = :name, phone = :phone, created_by_agent_id = :agent_id WHERE id = :id";
    $stmt = $conn->prepare($query);
    
    try {
        $stmt->execute([
            ':name' => $data->name,
            ':phone' => $data->phone ?? '',
            ':agent_id' => $data->created_by_agent_id ?? null,
            ':id' => $id
        ]);
        echo json_encode(["message" => "Mteja amesasishwa"]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Hitilafu: " . $e->getMessage()]);
    }
}
elseif ($method === 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["message" => "ID inahitajika"]);
        exit();
    }
    
    $stmt = $conn->prepare("DELETE FROM customers WHERE id = :id");
    $stmt->execute([':id' => $id]);
    echo json_encode(["message" => "Mteja amefutwa"]);
}
?>