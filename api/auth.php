<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once 'config.php'; // Hakikisha config.php ipo kwenye folda hii ya api

$data = json_decode(file_get_contents("php://input"));
$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. KAGUA EMAIL
if ($action == 'check-email' && $_SERVER['REQUEST_METHOD'] == 'POST') {
    if(!empty($data->email)) {
        $email = $data->email;
        $query = "SELECT id FROM users WHERE email = :email LIMIT 1";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(array("status" => "success", "message" => "Email imepatikana."));
        } else {
            http_response_code(404);
            echo json_encode(array("status" => "error", "message" => "Email hii haipo kwenye mfumo wetu."));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("status" => "error", "message" => "Tafadhali weka email."));
    }
} 
// 2. BADILISHA NENOSIRI
else if ($action == 'reset-password' && $_SERVER['REQUEST_METHOD'] == 'POST') {
    if(!empty($data->email) && !empty($data->password)) {
        $email = $data->email;
        $new_password = password_hash($data->password, PASSWORD_BCRYPT);

        $query = "UPDATE users SET password = :password WHERE email = :email";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':password', $new_password);
        $stmt->bindParam(':email', $email);

        if($stmt->execute() && $stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(array("status" => "success", "message" => "Nenosiri limebadilishwa!"));
        } else {
            http_response_code(500);
            echo json_encode(array("status" => "error", "message" => "Imeshindikana kubadilisha nenosiri."));
        }
    }
}
?>