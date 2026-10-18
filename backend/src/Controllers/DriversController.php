<?php
declare(strict_types=1);

namespace GulfTaxis\Controllers;

use GulfTaxis\Config\Database;
use GulfTaxis\Middleware\AuthMiddleware;
use GulfTaxis\Middleware\RoleMiddleware;
use GulfTaxis\Utils\Response;
use PDO;

class DriversController
{
    public function index(): void
    {
        AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $stmt = $db->query('
            SELECT d.*, 
                   COUNT(CASE WHEN b.status NOT IN ("Completed", "Cancelled") AND b.pickup_date = CURDATE() THEN 1 END) AS today_active_trips,
                   v.registration_no AS assigned_vehicle_reg,
                   v.make_model AS assigned_vehicle_model
            FROM drivers d
            LEFT JOIN bookings b ON d.id = b.assigned_driver_id
            LEFT JOIN vehicles v ON d.id = v.assigned_driver_id
            GROUP BY d.id
            ORDER BY d.name ASC
        ');
        $drivers = $stmt->fetchAll();

        Response::success($drivers);
    }

    public function store(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::requireDispatcherOrAdmin($user);
        $db = Database::getConnection();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $name = trim($input['name'] ?? '');
        $phone = trim($input['phone'] ?? '');

        if (empty($name) || empty($phone)) {
            Response::error('Driver name and primary mobile number are required.', 422);
            return;
        }

        $stmt = $db->prepare('
            INSERT INTO drivers (uuid, name, phone, whatsapp, license_no, status, availability, notes)
            VALUES (UUID(), :name, :phone, :whatsapp, :license_no, :status, :avail, :notes)
        ');
        $stmt->execute([
            'name'       => $name,
            'phone'      => $phone,
            'whatsapp'   => $input['whatsapp'] ?? $phone,
            'license_no' => $input['license_no'] ?? null,
            'status'     => $input['status'] ?? 'active',
            'avail'      => $input['availability'] ?? 'on_duty',
            'notes'      => $input['notes'] ?? null
        ]);

        Response::success(['id' => $db->lastInsertId()], 'Driver registered successfully.', 201);
    }

    public function update(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::requireDispatcherOrAdmin($user);
        $db = Database::getConnection();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $stmt = $db->prepare('
            UPDATE drivers SET
                name = COALESCE(:name, name),
                phone = COALESCE(:phone, phone),
                whatsapp = COALESCE(:whatsapp, whatsapp),
                license_no = COALESCE(:license, license_no),
                status = COALESCE(:status, status),
                availability = COALESCE(:avail, availability),
                notes = COALESCE(:notes, notes),
                updated_at = NOW()
            WHERE id = :id
        ');
        $stmt->execute([
            'id'       => $id,
            'name'     => $input['name'] ?? null,
            'phone'    => $input['phone'] ?? null,
            'whatsapp' => $input['whatsapp'] ?? null,
            'license'  => $input['license_no'] ?? null,
            'status'   => $input['status'] ?? null,
            'avail'    => $input['availability'] ?? null,
            'notes'    => $input['notes'] ?? null
        ]);

        Response::success(null, 'Driver details updated.');
    }
}
