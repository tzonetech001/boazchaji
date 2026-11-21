<?php
// backend/api/stats.php
require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $role = isset($_GET['role']) ? $_GET['role'] : 'agent';
    $agent_id = isset($_GET['agent_id']) ? $_GET['agent_id'] : null;

    // 1. Jumla ya Pending (Hazijalipiwa)
    $pendingQuery = "SELECT SUM(amount * quantity) as total, COUNT(id) as count 
                     FROM services WHERE status = 'pending'";
    
    // 2. Jumla ya Paid (Zilizolipiwa)
    $paidQuery = "SELECT SUM(amount * quantity) as total, COUNT(id) as count 
                  FROM services WHERE status = 'paid'";

    // Kama ni agent, filter kwa ID yake
    if ($role === 'agent' && $agent_id) {
        $pendingQuery .= " AND agent_id = :agent_id";
        $paidQuery .= " AND agent_id = :agent_id";
    }

    $stmt = $conn->prepare($pendingQuery);
    if ($role === 'agent' && $agent_id) $stmt->bindParam(':agent_id', $agent_id);
    $stmt->execute();
    $pending = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare($paidQuery);
    if ($role === 'agent' && $agent_id) $stmt->bindParam(':agent_id', $agent_id);
    $stmt->execute();
    $paid = $stmt->fetch(PDO::FETCH_ASSOC);

    // 3. Idadi ya Agents (Admin pekee)
    $agentsCount = 0;
    if ($role === 'admin') {
        $stmt = $conn->prepare("SELECT COUNT(id) as count FROM users WHERE role = 'agent'");
        $stmt->execute();
        $agentsCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    }

    echo json_encode([
        "pending_total" => $pending['total'] ?? 0,
        "pending_count" => $pending['count'] ?? 0,
        "paid_total" => $paid['total'] ?? 0,
        "paid_count" => $paid['count'] ?? 0,
        "agents_count" => $agentsCount
    ]);
}
?>