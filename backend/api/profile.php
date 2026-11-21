<?php
// backend/api/profile.php
require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->id)) {
        http_response_code(400);
        echo json_encode(["message" => "ID ya mtumiaji inahitajika"]);
        exit();
    }

    // Angalia kama ni kubadilisha password au taarifa nyingine
    if (isset($data->action) && $data->action === 'change_password') {
        
        // 1. Hakiki password ya sasa
        $query = "SELECT password FROM users WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([':id' => $data->id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!password_verify($data->current_password, $user['password'])) {
            http_response_code(401);
            echo json_encode(["message" => "Password ya sasa si sahihi."]);
            exit();
        }

        // 2. Badilisha password
        $newHashed = password_hash($data->new_password, PASSWORD_BCRYPT);
        $updateQuery = "UPDATE users SET password = :password WHERE id = :id";
        $stmt = $conn->prepare($updateQuery);
        $stmt->execute([':password' => $newHashed, ':id' => $data->id]);
        
        echo json_encode(["message" => "Password imebadilishwa kikamilifu."]);
    } 
    else {
        // Kubadilisha taarifa za kawaida (jina, email, lugha, theme)
        $query = "UPDATE users SET 
                    first_name = :first_name, 
                    second_name = :second_name, 
                    last_name = :last_name, 
                    email = :email,
                    language = :language,
                    theme = :theme
                  WHERE id = :id";
        
        $stmt = $conn->prepare($query);
        
        try {
            $stmt->execute([
                ':first_name' => $data->first_name,
                ':second_name' => $data->second_name ?? '',
                ':last_name' => $data->last_name,
                ':email' => $data->email ?? '',
                ':language' => $data->language ?? 'sw',
                ':theme' => $data->theme ?? 'light',
                ':id' => $data->id
            ]);
            echo json_encode(["message" => "Taarifa zimehifadhiwa."]);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Hitilafu: " . $e->getMessage()]);
        }
    }
}
?>