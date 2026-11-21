<?php
require_once '../config.php'; // Nimeongeza '../'

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

$data = json_decode(file_get_contents("php://input"));
$action = isset($_GET['action']) ? $_GET['action'] : '';

// HATUA YA 1: Kagua kama email ipo
if ($action === 'check-email' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!empty($data->email)) {
        $email = trim($data->email);
        $query = "SELECT id FROM users WHERE email = :email LIMIT 1";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(["status" => "success", "message" => "Email imepatikana. Sasa weka nenosiri jipya."]);
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Email hii haipo kwenye mfumo wetu."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Tafadhali weka email."]);
    }
}
// HATUA YA 2: Badilisha nenosiri
else if ($action === 'reset-password' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!empty($data->email) && !empty($data->password)) {
        $email = trim($data->email);
        $newPassword = password_hash($data->password, PASSWORD_BCRYPT);

        $query = "UPDATE users SET password = :password WHERE email = :email";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':password', $newPassword);
        $stmt->bindParam(':email', $email);

        if ($stmt->execute() && $stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(["status" => "success", "message" => "Nenosiri limebadilishwa kikamilifu. Sasa unaweza kuingia."]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Imeshindikana kubadilisha nenosiri."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Tafadhali jaza email na nenosiri."]);
    }
}
?>