<?php
// backend/api/auth.php
require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($method === 'POST' && $action === 'register') {
    // KUSIJILI MTUMIAJI MPYA (Kawaida Admin tu ndio hufanya hivi, lakini tunaiacha wazi)
    $data = json_decode(file_get_contents("php://input"));

    // Validation ya namba ya simu (07 au 06 kisha tarakimu 8)
    if (!preg_match('/^(07|06)[0-9]{8}$/', $data->phone)) {
        http_response_code(400);
        echo json_encode(["message" => "Namba ya simu si sahihi. Lazima ianze na 07 au 06 na iwe na tarakimu 10."]);
        exit();
    }

    // Angalia kama namba ipo
    $checkQuery = "SELECT id FROM users WHERE phone = :phone";
    $stmt = $conn->prepare($checkQuery);
    $stmt->execute([':phone' => $data->phone]);
    if ($stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(["message" => "Namba hii ya simu tayari imesajiliwa."]);
        exit();
    }

    // Hifadhi mtumiaji
    $query = "INSERT INTO users (first_name, second_name, last_name, phone, email, sex, password, role) 
              VALUES (:first_name, :second_name, :last_name, :phone, :email, :sex, :password, :role)";
    
    $stmt = $conn->prepare($query);
    $hashed_password = password_hash($data->password, PASSWORD_BCRYPT);

    try {
        $stmt->execute([
            ':first_name' => $data->first_name,
            ':second_name' => $data->second_name ?? '',
            ':last_name' => $data->last_name,
            ':phone' => $data->phone,
            ':email' => $data->email ?? '',
            ':sex' => $data->sex,
            ':password' => $hashed_password,
            ':role' => $data->role ?? 'agent' // Admin anaweza kuweka role
        ]);
        http_response_code(201);
        echo json_encode(["message" => "Mtumiaji amesajiliwa kikamilifu."]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Hitilafu: " . $e->getMessage()]);
    }

} elseif ($method === 'POST' && $action === 'login') {
    // KUNGIA (LOGIN)
    $data = json_decode(file_get_contents("php://input"));

    $query = "SELECT id, first_name, last_name, phone, email, password, role, language, theme FROM users WHERE phone = :phone";
    $stmt = $conn->prepare($query);
    $stmt->execute([':phone' => $data->phone]);
    
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Hakiki password
        if (password_verify($data->password, $user['password'])) {
            // Kwa mfano huu, tunatengeneza token ya kizamani (Base64). 
            // Kwenye production halisi, tumia JWT library.
            $token = base64_encode(json_encode(["id" => $user['id'], "role" => $user['role']]));
            
            unset($user['password']); // Ondoa password kwenye majibu
            
            http_response_code(200);
            echo json_encode([
                "message" => "Umeingia kikamilifu",
                "token" => $token,
                "user" => $user
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Password si sahihi."]);
        }
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Mtumiaji hajapatikana."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method haijaruhusiwa."]);
}
?>