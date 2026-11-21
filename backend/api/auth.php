<?php
// backend/api/auth.php
require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Helper function ya ku-log activity
function logActivity($conn, $user_id, $action, $details = null) {
    try {
        $query = "INSERT INTO activity_logs (user_id, action, details) VALUES (:user_id, :action, :details)";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':user_id' => $user_id,
            ':action' => $action,
            ':details' => $details
        ]);
    } catch (PDOException $e) {
        // Kimya kimya, usisumbue mtumiaji kama logging imeshindikana
    }
}

// =====================================================
// REGISTER
// =====================================================
if ($method === 'POST' && $action === 'register') {
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
            ':role' => $data->role ?? 'agent'
        ]);
        
        $newUserId = $conn->lastInsertId();
        logActivity($conn, $newUserId, 'REGISTER', 'Mtumiaji mpya amesajiliwa: ' . $data->phone);
        
        http_response_code(201);
        echo json_encode(["message" => "Mtumiaji amesajiliwa kikamilifu."]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Hitilafu: " . $e->getMessage()]);
    }

// =====================================================
// LOGIN
// =====================================================
} elseif ($method === 'POST' && $action === 'login') {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->phone) || empty($data->password)) {
        http_response_code(400);
        echo json_encode(["message" => "Namba na password vinahitajika."]);
        exit();
    }

    $query = "SELECT id, first_name, second_name, last_name, phone, email, password, role, language, theme FROM users WHERE phone = :phone";
    $stmt = $conn->prepare($query);
    $stmt->execute([':phone' => $data->phone]);
    
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (password_verify($data->password, $user['password'])) {
            $token = base64_encode(json_encode(["id" => $user['id'], "role" => $user['role']]));
            
            unset($user['password']);
            
            logActivity($conn, $user['id'], 'LOGIN', 'Mtumiaji ameingia kwenye mfumo');
            
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

// =====================================================
// FORGOT PASSWORD (Step 1: Verify Email)
// =====================================================
} elseif ($method === 'POST' && $action === 'forgot_password') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->email)) {
        http_response_code(400);
        echo json_encode(["message" => "Email inahitajika."]);
        exit();
    }

    $query = "SELECT id, first_name, email FROM users WHERE email = :email";
    $stmt = $conn->prepare($query);
    $stmt->execute([':email' => $data->email]);
    
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Kwenye mfumo halisi, hapa unatuma email yenye link/token.
        // Kwa mfano huu, tunarudisha user_id moja kwa moja.
        logActivity($conn, $user['id'], 'FORGOT_PASSWORD_REQUEST', 'Ombi la kurejesha password kwa: ' . $data->email);
        
        echo json_encode([
            "message" => "Email imepatikana. Tafadhali weka password mpya.",
            "user_id" => $user['id'],
            "user_name" => $user['first_name']
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Email haipo kwenye mfumo."]);
    }

// =====================================================
// RESET PASSWORD (Step 2: Set New Password)
// =====================================================
} elseif ($method === 'POST' && $action === 'reset_password') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->user_id) || empty($data->password)) {
        http_response_code(400);
        echo json_encode(["message" => "Taarifa hazijakamilika."]);
        exit();
    }

    if (strlen($data->password) < 6) {
        http_response_code(400);
        echo json_encode(["message" => "Password lazima iwe na herufi 6 au zaidi."]);
        exit();
    }

    $newHashed = password_hash($data->password, PASSWORD_BCRYPT);
    $query = "UPDATE users SET password = :password WHERE id = :id";
    $stmt = $conn->prepare($query);
    
    try {
        $stmt->execute([':password' => $newHashed, ':id' => $data->user_id]);
        
        logActivity($conn, $data->user_id, 'RESET_PASSWORD', 'Password imebadilishwa');
        
        echo json_encode(["message" => "Password imebadilishwa kikamilifu. Unaweza kuingia sasa."]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Hitilafu: " . $e->getMessage()]);
    }

// =====================================================
// INVALID ACTION
// =====================================================
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method au action haijaruhusiwa."]);
}
?>