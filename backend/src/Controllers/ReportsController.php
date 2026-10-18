<?php
declare(strict_types=1);

namespace GulfTaxis\Controllers;

use GulfTaxis\Config\Database;
use GulfTaxis\Middleware\AuthMiddleware;
use GulfTaxis\Utils\Response;
use PDO;

class ReportsController
{
    public function daily(): void
    {
        AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $date = $_GET['date'] ?? date('Y-m-d');

        // Summary KPI statistics for the selected date
        $summaryStmt = $db->prepare('
            SELECT 
                COUNT(*) AS total_today,
                COUNT(CASE WHEN status = "Pending" THEN 1 END) AS pending_count,
                COUNT(CASE WHEN status = "Assigned" THEN 1 END) AS assigned_count,
                COUNT(CASE WHEN assigned_driver_id IS NULL AND status NOT IN ("Completed", "Cancelled") THEN 1 END) AS unassigned_count,
                COUNT(CASE WHEN status = "Driver En Route" OR status = "Arrived" OR status = "Passenger Picked Up" THEN 1 END) AS in_progress_count,
                COUNT(CASE WHEN status = "Completed" THEN 1 END) AS completed_count,
                COUNT(CASE WHEN status = "Cancelled" THEN 1 END) AS cancelled_count,
                COUNT(CASE WHEN flight_number IS NOT NULL AND flight_number != "" THEN 1 END) AS airport_pickups_count
            FROM bookings 
            WHERE pickup_date = :dt
        ');
        $summaryStmt->execute(['dt' => $date]);
        $summary = $summaryStmt->fetch();

        // Drivers on duty count
        $driversOnDuty = (int)$db->query('SELECT COUNT(*) FROM drivers WHERE availability = "on_duty" AND status = "active"')->fetchColumn();
        $summary['drivers_on_duty'] = $driversOnDuty;

        // Trips by vehicle type for the day
        $vehStmt = $db->prepare('
            SELECT vehicle_type, COUNT(*) as count 
            FROM bookings 
            WHERE pickup_date = :dt 
            GROUP BY vehicle_type 
            ORDER BY count DESC
        ');
        $vehStmt->execute(['dt' => $date]);
        $vehicleBreakdown = $vehStmt->fetchAll();

        // Hourly distribution of pickups
        $hourlyStmt = $db->prepare('
            SELECT HOUR(pickup_time) AS pickup_hour, COUNT(*) AS count
            FROM bookings
            WHERE pickup_date = :dt
            GROUP BY HOUR(pickup_time)
            ORDER BY pickup_hour ASC
        ');
        $hourlyStmt->execute(['dt' => $date]);
        $hourlyPickups = $hourlyStmt->fetchAll();

        Response::success([
            'date' => $date,
            'summary' => $summary,
            'vehicle_breakdown' => $vehicleBreakdown,
            'hourly_pickups' => $hourlyPickups
        ]);
    }

    public function driverReport(): void
    {
        AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-7 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');

        $stmt = $db->prepare('
            SELECT 
                d.id, d.name, d.phone, d.availability, d.rating,
                COUNT(b.id) AS total_assigned_trips,
                COUNT(CASE WHEN b.status = "Completed" THEN 1 END) AS completed_trips,
                COUNT(CASE WHEN b.status = "Cancelled" THEN 1 END) AS cancelled_trips,
                COUNT(CASE WHEN b.status = "No Show" THEN 1 END) AS noshow_trips
            FROM drivers d
            LEFT JOIN bookings b ON d.id = b.assigned_driver_id 
                AND b.pickup_date BETWEEN :sdt AND :edt
            GROUP BY d.id
            ORDER BY total_assigned_trips DESC, d.name ASC
        ');
        $stmt->execute(['sdt' => $startDate, 'edt' => $endDate]);
        $report = $stmt->fetchAll();

        Response::success($report);
    }

    public function vehicleUtilization(): void
    {
        AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-7 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');

        $stmt = $db->prepare('
            SELECT 
                v.id, v.registration_no, v.make_model, v.vehicle_type, v.availability,
                COUNT(b.id) AS trip_count,
                COUNT(CASE WHEN b.status = "Completed" THEN 1 END) AS completed_trips
            FROM vehicles v
            LEFT JOIN bookings b ON v.id = b.assigned_vehicle_id 
                AND b.pickup_date BETWEEN :sdt AND :edt
            GROUP BY v.id
            ORDER BY trip_count DESC
        ');
        $stmt->execute(['sdt' => $startDate, 'edt' => $endDate]);
        $report = $stmt->fetchAll();

        Response::success($report);
    }
}
