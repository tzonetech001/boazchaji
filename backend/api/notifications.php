<?php
require_once '../config/db.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user_id = $_GET['user_id'] ?? null;
    $role = $_GET['role'] ?? 'agent';

    // Admin anaona zote, Agent anaona zake tu
    if ($role === 'admin') {
        $stmt = $conn->query("SELECT n.*, u.first_name as sender_name FROM notifications n LEFT JOIN users u ON n.sender_id = u.id ORDER BY n.created_at DESC");
    } else {
        $stmt = $conn->prepare("SELECT n.*, u.first_name as sender_name FROM notifications n LEFT JOIN users u ON n.sender_id = u.id WHERE n.receiver_id = :user_id ORDER BY n.created_at DESC");
        $stmt->execute([':user_id' => $user_id]);
    }
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} 
elseif ($method === 'POST') {
    $sender_id = $_POST['sender_id'] ?? null;
    $title = $_POST['title'] ?? '';
    $message = $_POST['message'] ?? '';
    $receiver_ids = isset($_POST['receiver_ids']) ? json_decode($_POST['receiver_ids'], true) : []; 

    // Upload Attachment (Max 2MB)
    $attachmentPath = null;
    if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
        if ($_FILES['attachment']['size'] > 2 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(["message" => "Faili ni kubwa mno. Kiwango ni 2MB pekee."]);
            exit();
        }
        $uploadDir = __DIR__ . '/../uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        
        $ext = strtolower(pathinfo($_FILES['attachment']['name'], PATHINFO_EXTENSION));
        $allowed = ['pdf', 'jpg', 'jpeg', 'png'];
        if (in_array($ext, $allowed)) {
            $fileName = uniqid('notif_') . '.' . $ext;
            if (move_uploaded_file($_FILES['attachment']['tmp_name'], $uploadDir . $fileName)) {
                $attachmentPath = 'uploads/' . $fileName;
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Aina ya faili hairuhusiwi. Tumia PDF au Picha."]);
            exit();
        }
    }

    try {
        if (empty($receiver_ids)) {
            // Broadcast kwa wote: Tunachukua users wote active na kuwatengenezea notification
            $stmt = $conn->query("SELECT id FROM users WHERE status = 'active'");
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $query = "INSERT INTO notifications (sender_id, receiver_id, title, message, attachment_path, type) VALUES (:sender, :receiver, :title, :msg, :att, 'message')";
            $stmt = $conn->prepare($query);
            foreach ($users as $u) {
                $stmt->execute([':sender' => $sender_id, ':receiver' => $u['id'], ':title' => $title, ':msg' => $message, ':att' => $attachmentPath]);
            }
        } else {
            // Tuma kwa wateule (Selected Agents)
            $query = "INSERT INTO notifications (sender_id, receiver_id, title, message, attachment_path, type) VALUES (:sender, :receiver, :title, :msg, :att, 'message')";
            $stmt = $conn->prepare($query);
            foreach ($receiver_ids as $rId) {
                $stmt->execute([':sender' => $sender_id, ':receiver' => $rId, ':title' => $title, ':msg' => $message, ':att' => $attachmentPath]);
            }
        }
        echo json_encode(["message" => "Ujumbe umetumwa kikamilifu"]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Hitilafu: " . $e->getMessage()]);
    }
}
elseif ($method === 'PUT') {
    // Mark as read
    $data = json_decode(file_get_contents("php://input"));
    $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE id = :id");
    $stmt->execute([':id' => $data->id]);
    echo json_encode(["message" => "Imesomwa"]);
}
elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (isset($data->ids) && is_array($data->ids) && count($data->ids) > 0) {
        // Bulk Delete
        $inQuery = implode(',', array_fill(0, count($data->ids), '?'));
        $stmt = $conn->prepare("DELETE FROM notifications WHERE id IN ($inQuery)");
        $stmt->execute($data->ids);
        echo json_encode(["message" => "Taarifa zilizochaguliwa zimefutwa"]);
    } else {
        // Futa zote (Admin)
        $conn->query("DELETE FROM notifications");
        echo json_encode(["message" => "Taarifa zote zimefutwa"]);
    }
}
?>