<?php
require_once '../config/db.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user_id = $_GET['user_id'] ?? null;
    $role = $_GET['role'] ?? 'agent';

    if ($role === 'admin') {
        $stmt = $conn->query("SELECT n.*, u.first_name as sender_name FROM notifications n LEFT JOIN users u ON n.sender_id = u.id ORDER BY n.created_at DESC");
    } else {
        $stmt = $conn->prepare("SELECT n.*, u.first_name as sender_name FROM notifications n LEFT JOIN users u ON n.sender_id = u.id WHERE n.receiver_id IS NULL OR n.receiver_id = :user_id ORDER BY n.created_at DESC");
        $stmt->execute([':user_id' => $user_id]);
    }
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} 
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $query = "INSERT INTO notifications (sender_id, receiver_id, title, message) VALUES (:sender, :receiver, :title, :msg)";
    $stmt = $conn->prepare($query);
    $stmt->execute([
        ':sender' => $data->sender_id,
        ':receiver' => empty($data->receiver_id) ? null : $data->receiver_id,
        ':title' => $data->title,
        ':msg' => $data->message
    ]);
    echo json_encode(["message" => "Ujumbe umetumwa"]);
}
elseif ($method === 'PUT') {
    // Mark as read
    $data = json_decode(file_get_contents("php://input"));
    $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE id = :id");
    $stmt->execute([':id' => $data->id]);
    echo json_encode(["message" => "Imesomwa"]);
}
elseif ($method === 'DELETE') {
    // Admin pekee anafuta zote
    $conn->query("DELETE FROM notifications");
    echo json_encode(["message" => "Zote zimefutwa"]);
}
?>