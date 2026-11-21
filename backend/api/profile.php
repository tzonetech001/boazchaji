<?php
// backend/api/profile.php
require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// =====================================================
// KUPANDISHA PICHA (POST - Multipart/FormData)
// =====================================================
if ($method === 'POST' && isset($_POST['action']) && $_POST['action'] === 'upload_image') {
    $user_id = $_POST['id'] ?? null;
    
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(["message" => "ID ya mtumiaji inahitajika"]);
        exit();
    }

    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["message" => "Picha haijapatikana au kuna hitilafu."]);
        exit();
    }

    // Tumia __DIR__ kupata path kamili kuepusha makosa ya 'file not found'
    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $fileExtension = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
    
    // Ruhusu aina fulani za picha pekee
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!in_array($fileExtension, $allowed)) {
        http_response_code(400);
        echo json_encode(["message" => "Aina ya picha hairuhusiwi. Tumia jpg, png, gif au webp."]);
        exit();
    }

    // Tafuta picha ya zamani ili tuifute baada ya kupandisha mpya
    $oldImageQuery = "SELECT profile_image FROM users WHERE id = :id";
    $stmt = $conn->prepare($oldImageQuery);
    $stmt->execute([':id' => $user_id]);
    $oldUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($oldUser && !empty($oldUser['profile_image'])) {
        $oldFilePath = $uploadDir . $oldUser['profile_image'];
        if (file_exists($oldFilePath)) {
            unlink($oldFilePath); // Futa picha ya zamani
        }
    }

    $newFileName = 'profile_' . $user_id . '_' . uniqid() . '.' . $fileExtension;
    $targetFile = $uploadDir . $newFileName;

    if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
        // Hifadhi jina la faili kwenye database
        $query = "UPDATE users SET profile_image = :image WHERE id = :id";
        $stmt = $conn->prepare($query);
        
        try {
            $stmt->execute([':image' => $newFileName, ':id' => $user_id]);
            echo json_encode([
                "message" => "Picha imebadilishwa kikamilifu.",
                "image_path" => $newFileName
            ]);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Hitilafu ya database: " . $e->getMessage()]);
        }
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Imeshindwa kuhifadhi picha. Hakikisha folder 'uploads' lina ruhusa (chmod 755 au 777)."]);
    }
}

// =====================================================
// UPDATE PROFILE (PUT - JSON)
// =====================================================
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->id)) {
        http_response_code(400);
        echo json_encode(["message" => "ID ya mtumiaji inahitajika"]);
        exit();
    }

    if (isset($data->action) && $data->action === 'change_password') {
        $query = "SELECT password FROM users WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([':id' => $data->id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!password_verify($data->current_password, $user['password'])) {
            http_response_code(401);
            echo json_encode(["message" => "Password ya sasa si sahihi."]);
            exit();
        }

        $newHashed = password_hash($data->new_password, PASSWORD_BCRYPT);
        $updateQuery = "UPDATE users SET password = :password WHERE id = :id";
        $stmt = $conn->prepare($updateQuery);
        $stmt->execute([':password' => $newHashed, ':id' => $data->id]);
        
        echo json_encode(["message" => "Password imebadilishwa kikamilifu."]);
    } 
    else {
        // Update taarifa za kawaida
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