<?php
declare(strict_types=1);

namespace GulfTaxis\Controllers;

use GulfTaxis\Config\Database;
use GulfTaxis\Middleware\AuthMiddleware;
use GulfTaxis\Middleware\RoleMiddleware;
use GulfTaxis\Utils\Response;
use PDO;

class VehiclesController
{
    public function index(): void
    {
        AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $stmt = $db->query('
            SELECT v.*, d.name AS assigned_driver_name, d.phone AS assigned_driver_phone
            FROM vehicles v
            LEFT JOIN drivers d ON v.assigned_driver_id = d.id
            ORDER BY v.vehicle_type ASC, v.registration_no ASC
        ');
        $vehicles = $stmt->fetchAll();

        Response::success($vehicles);
    }

    public function store(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::requireDispatcherOrAdmin($user);
        $db = Database::getConnection();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $regNo = trim($input['registration_no'] ?? '');
        $makeModel = trim($input['make_model'] ?? '');
        $vehicleType = trim($input['vehicle_type'] ?? 'Sedan');

        if (empty($regNo) || empty($makeModel)) {
            Response::error('Registration number and vehicle make/model are required.', 422);
            return;
        }

        $stmt = $db->prepare('
            INSERT INTO vehicles (uuid, registration_no, make_model, vehicle_type, passenger_capacity, luggage_capacity, availability, assigned_driver_id, maintenance_notes)
            VALUES (UUID(), :reg, :mm, :vt, :pc, :lc, :avail, :did, :notes)
        ');
        $stmt->execute([
            'reg'   => $regNo,
            'mm'    => $makeModel,
            'vt'    => $vehicleType,
            'pc'    => max(1, (int)($input['passenger_capacity'] ?? 4)),
            'lc'    => max(0, (int)($input['luggage_capacity'] ?? 3)),
            'avail' => $input['availability'] ?? 'available',
            'did'   => !empty($input['assigned_driver_id']) ? (int)$input['assigned_driver_id'] : null,
            'notes' => $input['maintenance_notes'] ?? null
        ]);

        Response::success(['id' => $db->lastInsertId()], 'Vehicle added to fleet successfully.', 201);
    }

    public function update(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::requireDispatcherOrAdmin($user);
        $db = Database::getConnection();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $stmt = $db->prepare('
            UPDATE vehicles SET
                registration_no = COALESCE(:reg, registration_no),
                make_model = COALESCE(:mm, make_model),
                vehicle_type = COALESCE(:vt, vehicle_type),
                passenger_capacity = COALESCE(:pc, passenger_capacity),
                luggage_capacity = COALESCE(:lc, luggage_capacity),
                availability = COALESCE(:avail, availability),
                assigned_driver_id = :did,
                maintenance_notes = COALESCE(:notes, maintenance_notes),
                updated_at = NOW()
            WHERE id = :id
        ');
        $stmt->execute([
            'id'    => $id,
            'reg'   => $input['registration_no'] ?? null,
            'mm'    => $input['make_model'] ?? null,
            'vt'    => $input['vehicle_type'] ?? null,
            'pc'    => isset($input['passenger_capacity']) ? (int)$input['passenger_capacity'] : null,
            'lc'    => isset($input['luggage_capacity']) ? (int)$input['luggage_capacity'] : null,
            'avail' => $input['availability'] ?? null,
            'did'   => array_key_exists('assigned_driver_id', $input) ? ($input['assigned_driver_id'] ? (int)$input['assigned_driver_id'] : null) : null,
            'notes' => $input['maintenance_notes'] ?? null
        ]);

        Response::success(null, 'Vehicle details updated successfully.');
    }
}
