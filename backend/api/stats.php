<?php
require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $role = isset($_GET['role']) ? $_GET['role'] : 'agent';
    $agent_id = isset($_GET['agent_id']) ? $_GET['agent_id'] : null;

    // 1. Jumla ya Pending (Hazijalipiwa)
    $pendingQuery = "SELECT SUM(amount * quantity) as total, COUNT(id) as count FROM services WHERE status = 'pending'";
    
    // 2. Jumla ya Paid (Zilizolipiwa)
    $paidQuery = "SELECT SUM(amount * quantity) as total, COUNT(id) as count FROM services WHERE status = 'paid'";

    // 3. Idadi ya Wateja
    $customersQuery = "SELECT COUNT(id) as count FROM customers";

    // Kama ni agent, filter kwa ID yake
    if ($role === 'agent' && $agent_id) {
        $pendingQuery .= " AND agent_id = :agent_id";
        $paidQuery .= " AND agent_id = :agent_id";
        $customersQuery .= " WHERE created_by_agent_id = :agent_id";
    }

    // Pata Pending
    $stmt = $conn->prepare($pendingQuery);
    if ($role === 'agent' && $agent_id) $stmt->bindParam(':agent_id', $agent_id);
    $stmt->execute();
    $pending = $stmt->fetch(PDO::FETCH_ASSOC);

    // Pata Paid
    $stmt = $conn->prepare($paidQuery);
    if ($role === 'agent' && $agent_id) $stmt->bindParam(':agent_id', $agent_id);
    $stmt->execute();
    $paid = $stmt->fetch(PDO::FETCH_ASSOC);

    // Pata Customers
    $stmt = $conn->prepare($customersQuery);
    if ($role === 'agent' && $agent_id) $stmt->bindParam(':agent_id', $agent_id);
    $stmt->execute();
    $customers = $stmt->fetch(PDO::FETCH_ASSOC);

    // 4. Idadi ya Agents (Admin pekee)
    $agentsCount = 0;
    if ($role === 'admin') {
        $stmt = $conn->prepare("SELECT COUNT(id) as count FROM users WHERE role = 'agent' AND status = 'active'");
        $stmt->execute();
        $agentsCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    }

    // 5. Data za Grafu (Mauzo ya siku 1-31 kwa mwezi wa sasa)
    $currentMonth = date('m');
    $currentYear = date('Y');
    
    $chartQuery = "SELECT DAY(created_at) as day, SUM(amount * quantity) as total 
                   FROM services 
                   WHERE status = 'paid' 
                   AND MONTH(created_at) = :month 
                   AND YEAR(created_at) = :year";
    
    if ($role === 'agent' && $agent_id) {
        $chartQuery .= " AND agent_id = :agent_id";
    }
    $chartQuery .= " GROUP BY DAY(created_at)";

    $stmt = $conn->prepare($chartQuery);
    $stmt->bindParam(':month', $currentMonth);
    $stmt->bindParam(':year', $currentYear);
    if ($role === 'agent' && $agent_id) $stmt->bindParam(':agent_id', $agent_id);
    $stmt->execute();
    $chartData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Jenga array ya siku 1 hadi 31 (default ni 0)
    $daysInMonth = date('t'); // Idadi ya siku kwenye mwezi husika
    $dailySales = array_fill(1, $daysInMonth, 0);
    
    foreach ($chartData as $row) {
        $dailySales[$row['day']] = (float)$row['total'];
    }
    // Badilisha keys ziwe 0-indexed kwa ajili ya Chart.js
    $dailySalesArray = array_values($dailySales);

    // 6. Wateja wa Hivi Karibuni (Recent Customers)
    $recentCustQuery = "SELECT name, phone, created_at FROM customers";
    if ($role === 'agent' && $agent_id) {
        $recentCustQuery .= " WHERE created_by_agent_id = :agent_id";
    }
    $recentCustQuery .= " ORDER BY created_at DESC LIMIT 10";

    $stmt = $conn->prepare($recentCustQuery);
    if ($role === 'agent' && $agent_id) $stmt->bindParam(':agent_id', $agent_id);
    $stmt->execute();
    $recentCustomers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "pending_total" => $pending['total'] ?? 0,
        "pending_count" => $pending['count'] ?? 0,
        "paid_total" => $paid['total'] ?? 0,
        "paid_count" => $paid['count'] ?? 0,
        "agents_count" => $agentsCount,
        "customers_count" => $customers['count'] ?? 0,
        "chart_data" => $dailySalesArray,
        "recent_customers" => $recentCustomers,
        "current_month" => date('F Y')
    ]);
}
?>