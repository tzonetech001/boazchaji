<?php
require_once '../config.php'; // Nimeongeza '../' kwa sababu iko ndani ya folder la auth

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->identifier) && !empty($data->password)) {
    $identifier = trim($data->identifier);
    
    // Kagua kama ni email au namba ya simu
    $query = "SELECT id, first_name, last_name, email, phone, password, role, is_super_admin, language, theme 
              FROM users WHERE email = :identifier OR phone = :identifier LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':identifier', $identifier);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch();
        
        // Kagua password
        if (password_verify($data->password, $user['password'])) {
            // Tengeneza Token (Hakikisha generateJWT ipo kwenye config.php)
            $token = generateJWT($user['id'], $user['email'] ?? $user['phone'], $config['jwt_secret']);
            
            http_response_code(200);
            echo json_encode([
                "status" => "success",
                "message" => "Kuingia kumefanikiwa",
                "token" => $token,
                "user" => [
                    "id" => (int)$user['id'],
                    "first_name" => $user['first_name'],
                    "last_name" => $user['last_name'],
                    "email" => $user['email'],
                    "phone" => $user['phone'],
                    "role" => $user['role'],
                    "is_super_admin" => (bool)$user['is_super_admin'],
                    "language" => $user['language'],
                    "theme" => $user['theme']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Nenosiri si sahihi."]);
        }
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Mtumiaji hajapatikana."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Tafadhali jaza namba ya simu/email na nenosiri."]);
}
?>