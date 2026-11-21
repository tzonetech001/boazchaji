<?php
// backend/api/users.php
require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Kama ni GET - Admin anapata orodha ya agents wote
if ($method === 'GET') {
    $query = "SELECT id, first_name, second_name, last_name, phone, email, sex, role, created_at 
              FROM users WHERE role = 'agent' ORDER BY created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $agents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($agents);
}

// Kama ni POST - Admin anaongeza agent mpya
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    // Validation ya namba ya simu
    if (!preg_match('/^(07|06)[0-9]{8}$/', $data->phone)) {
        http_response_code(400);
        echo json_encode(["message" => "Namba ya simu si sahihi. Lazima ianze na 07 au 06."]);
        exit();
    }

    // Angalia kama namba ipo
    $checkQuery = "SELECT id FROM users WHERE phone = :phone";
    $stmt = $conn->prepare($checkQuery);
    $stmt->execute([':phone' => $data->phone]);
    if ($stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(["message" => "Namba hii tayari imesajiliwa."]);
        exit();
    }

    $query = "INSERT INTO users (first_name, second_name, last_name, phone, email, sex, password, role) 
              VALUES (:first_name, :second_name, :last_name, :phone, :email, :sex, :password, 'agent')";
    $stmt = $conn->prepare($query);
    
    try {
        $stmt->execute([
            ':first_name' => $data->first_name,
            ':second_name' => $data->second_name ?? '',
            ':last_name' => $data->last_name,
            ':phone' => $data->phone,
            ':email' => $data->email ?? '',
            ':sex' => $data->sex,
            ':password' => password_hash($data->password, PASSWORD_BCRYPT)
        ]);
        http_response_code(201);
        echo json_encode(["message" => "Agent ameongezwa kikamilifu."]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Hitilafu: " . $e->getMessage()]);
    }
}

// Kama ni DELETE - Admin anafuta agent
elseif ($method === 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["message" => "ID inahitajika"]);
        exit();
    }

    $query = "DELETE FROM users WHERE id = :id AND role = 'agent'";
    $stmt = $conn->prepare($query);
    $stmt->execute([':id' => $id]);
    echo json_encode(["message" => "Agent amefutwa."]);
}
// 4. PUT - Kuedit mtumiaji
if ($method === 'PUT' && isset($_GET['action']) && $_GET['action'] === 'edit') {
    $data = json_decode(file_get_contents("php://input"));
    $id = $data->id;

    $query = "UPDATE users SET first_name = :first_name, last_name = :last_name, phone = :phone, email = :email, sex = :sex WHERE id = :id";
    $stmt = $conn->prepare($query);
    
    try {
        $stmt->execute([
            ':first_name' => $data->first_name,
            ':last_name' => $data->last_name,
            ':phone' => $data->phone,
            ':email' => $data->email ?? '',
            ':sex' => $data->sex,
            ':id' => $id
        ]);
        echo json_encode(["message" => "Mtumiaji amehaririwa."]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Hitilafu: " . $e->getMessage()]);
    }
}

// 5. PATCH - Kudeactivate mtumiaji
if ($method === 'PATCH' && isset($_GET['action']) && $_GET['action'] === 'deactivate') {
    $data = json_decode(file_get_contents("php://input"));
    $id = $data->id;

    $query = "UPDATE users SET status = 'inactive' WHERE id = :id";
    $stmt = $conn->prepare($query);
    $stmt->execute([':id' => $id]);
    echo json_encode(["message" => "Mtumiaji amedeactivate."]);
}

// 6. PATCH - Kuweka kwenye Trash
if ($method === 'PATCH' && isset($_GET['action']) && $_GET['action'] === 'trash') {
    $data = json_decode(file_get_contents("php://input"));
    $id = $data->id;

    $query = "UPDATE users SET status = 'trash' WHERE id = :id";
    $stmt = $conn->prepare($query);
    $stmt->execute([':id' => $id]);
    echo json_encode(["message" => "Mtumiaji amewekwa kwenye trash."]);
}

// 7. GET - Kupata watumiaji (Active tu)
if ($method === 'GET' && !isset($_GET['action'])) {
    $query = "SELECT id, first_name, second_name, last_name, phone, email, sex, role, created_at FROM users WHERE role = 'agent' AND status = 'active' ORDER BY created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}
?>