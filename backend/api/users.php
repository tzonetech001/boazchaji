<?php
// backend/api/users.php
require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// =====================================================
// GET - Orodha ya watumiaji wote
// =====================================================
if ($method === 'GET') {
    $query = "SELECT id, first_name, second_name, last_name, phone, email, sex, role, status, profile_image, created_at 
              FROM users ORDER BY created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($users);
}

// =====================================================
// POST - Kuongeza mtumiaji mpya
// =====================================================
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!preg_match('/^(07|06)[0-9]{8}$/', $data->phone)) {
        http_response_code(400);
        echo json_encode(["message" => "Namba ya simu si sahihi. Lazima ianze na 07 au 06."]);
        exit();
    }

    $checkQuery = "SELECT id FROM users WHERE phone = :phone";
    $stmt = $conn->prepare($checkQuery);
    $stmt->execute([':phone' => $data->phone]);
    if ($stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(["message" => "Namba hii tayari imesajiliwa."]);
        exit();
    }

    $role = isset($data->role) && in_array($data->role, ['admin', 'agent']) ? $data->role : 'agent';
    
    $query = "INSERT INTO users (first_name, second_name, last_name, phone, email, sex, password, role, status) 
              VALUES (:first_name, :second_name, :last_name, :phone, :email, :sex, :password, :role, 'active')";
    $stmt = $conn->prepare($query);
    
    try {
        $stmt->execute([
            ':first_name' => $data->first_name,
            ':second_name' => $data->second_name ?? '',
            ':last_name' => $data->last_name,
            ':phone' => $data->phone,
            ':email' => $data->email ?? '',
            ':sex' => $data->sex,
            ':password' => password_hash($data->password, PASSWORD_BCRYPT),
            ':role' => $role
        ]);
        http_response_code(201);
        echo json_encode(["message" => "Mtumiaji ameongezwa kikamilifu."]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Hitilafu: " . $e->getMessage()]);
    }
}

// =====================================================
// PUT - Kuedit taarifa au kubadilisha Status
// =====================================================
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    $id = $data->id ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(["message" => "ID inahitajika."]);
        exit();
    }

    // Kama ni kubadilisha status tu (Deactivate/Activate/Restore)
    if (isset($data->status) && !isset($data->first_name)) {
        $query = "UPDATE users SET status = :status WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([':status' => $data->status, ':id' => $id]);
        echo json_encode(["message" => "Hali ya mtumiaji imebadilishwa."]);
        exit();
    }

    // Kama ni kuedit taarifa kamili
    $query = "UPDATE users SET first_name = :first_name, second_name = :second_name, last_name = :last_name, 
              phone = :phone, email = :email, sex = :sex, role = :role WHERE id = :id";
    $stmt = $conn->prepare($query);
    
    try {
        $stmt->execute([
            ':first_name' => $data->first_name,
            ':second_name' => $data->second_name ?? '',
            ':last_name' => $data->last_name,
            ':phone' => $data->phone,
            ':email' => $data->email ?? '',
            ':sex' => $data->sex,
            ':role' => $data->role ?? 'agent',
            ':id' => $id
        ]);
        
        if (!empty($data->password)) {
            $passQuery = "UPDATE users SET password = :password WHERE id = :id";
            $stmt = $conn->prepare($passQuery);
            $stmt->execute([':password' => password_hash($data->password, PASSWORD_BCRYPT), ':id' => $id]);
        }
        
        echo json_encode(["message" => "Taarifa zimehaririwa."]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Hitilafu: " . $e->getMessage()]);
    }
}

// =====================================================
// DELETE - Kufuta mtumiaji kabisa
// =====================================================
elseif ($method === 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["message" => "ID inahitajika"]);
        exit();
    }

    try {
        $query = "DELETE FROM users WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([':id' => $id]);
        echo json_encode(["message" => "Mtumiaji amefutwa kabisa."]);
    } catch(PDOException $e) {
        // Hii itanasa kama kuna foreign key constraint inamzuia kufutwa
        http_response_code(500);
        echo json_encode(["message" => "Imeshindwa kufuta mtumiaji. Kuna data zinazohusiana na mtumiaji huyu (Mfano: Huduma alizorekodi). " . $e->getMessage()]);
    }
}

// =====================================================
// PATCH - Kuweka kwenye Trash
// =====================================================
elseif ($method === 'PATCH' && $action === 'trash') {
    $data = json_decode(file_get_contents("php://input"));
    $id = $data->id ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(["message" => "ID inahitajika"]);
        exit();
    }

    $query = "UPDATE users SET status = 'trash' WHERE id = :id";
    $stmt = $conn->prepare($query);
    $stmt->execute([':id' => $id]);
    echo json_encode(["message" => "Mtumiaji amewekwa kwenye trash."]);
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method au action haijaruhusiwa."]);
}
?>