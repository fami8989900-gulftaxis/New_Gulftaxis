<?php
declare(strict_types=1);

namespace GulfTaxis\Controllers;

use GulfTaxis\Config\Database;
use GulfTaxis\Middleware\AuthMiddleware;
use GulfTaxis\Middleware\RoleMiddleware;
use GulfTaxis\Utils\Response;
use PDO;

class BookingsController
{
    public function index(): void
    {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        // Query parameters
        $status = $_GET['status'] ?? null;
        $date = $_GET['date'] ?? null;
        $driverId = $_GET['driver_id'] ?? null;
        $vehicleId = $_GET['vehicle_id'] ?? null;
        $search = trim($_GET['search'] ?? '');
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(5, (int)($_GET['limit'] ?? 25)));
        $offset = ($page - 1) * $limit;

        $conditions = [];
        $params = [];

        if (!empty($status) && $status !== 'ALL') {
            $conditions[] = 'b.status = :status';
            $params['status'] = $status;
        }

        if (!empty($date)) {
            $conditions[] = 'b.pickup_date = :date';
            $params['date'] = $date;
        }

        if (!empty($driverId)) {
            $conditions[] = 'b.assigned_driver_id = :driver_id';
            $params['driver_id'] = $driverId;
        }

        if (!empty($vehicleId)) {
            $conditions[] = 'b.assigned_vehicle_id = :vehicle_id';
            $params['vehicle_id'] = $vehicleId;
        }

        if (!empty($search)) {
            $conditions[] = '(b.booking_ref LIKE :s OR b.flight_number LIKE :s OR b.passenger_name LIKE :s OR b.passenger_phone LIKE :s OR b.pickup_location LIKE :s OR b.dropoff_location LIKE :s)';
            $params['s'] = '%' . $search . '%';
        }

        $whereClause = count($conditions) > 0 ? 'WHERE ' . implode(' AND ', $conditions) : '';

        // Total count
        $countSql = "SELECT COUNT(*) FROM bookings b {$whereClause}";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        // Fetch records with joined driver and vehicle names
        $sql = "
            SELECT 
                b.id,
                b.uuid,
                b.booking_ref,
                b.pickup_date,
                DATE_FORMAT(b.pickup_time, '%H:%i') AS pickup_time,
                b.flight_number,
                b.vehicle_type,
                b.passenger_name,
                b.passenger_phone,
                b.passenger_whatsapp,
                b.passenger_email,
                b.airline_terminal,
                b.pickup_location,
                b.dropoff_location,
                b.passenger_count,
                b.luggage_count,
                b.assigned_driver_id,
                b.assigned_vehicle_id,
                b.booking_source,
                b.customer_notes,
                b.driver_instructions,
                b.status,
                b.internal_remarks,
                b.created_by_user_id,
                b.last_updated_by_user_id,
                b.version,
                b.created_at,
                b.updated_at,
                d.name AS driver_name,
                d.phone AS driver_phone,
                v.registration_no AS vehicle_registration,
                v.make_model AS vehicle_model
            FROM bookings b
            LEFT JOIN drivers d ON b.assigned_driver_id = d.id
            LEFT JOIN vehicles v ON b.assigned_vehicle_id = v.id
            {$whereClause}
            ORDER BY b.pickup_date ASC, b.pickup_time ASC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $db->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue(':' . $key, $val);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll();

        Response::success([
            'items' => $items,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total_items' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }

    public function show(int $id): void
    {
        AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $stmt = $db->prepare('
            SELECT b.*, 
                   d.name AS driver_name, d.phone AS driver_phone, d.whatsapp AS driver_whatsapp,
                   v.registration_no AS vehicle_registration, v.make_model AS vehicle_model,
                   u1.full_name AS created_by_name,
                   u2.full_name AS updated_by_name
            FROM bookings b
            LEFT JOIN drivers d ON b.assigned_driver_id = d.id
            LEFT JOIN vehicles v ON b.assigned_vehicle_id = v.id
            LEFT JOIN users u1 ON b.created_by_user_id = u1.id
            LEFT JOIN users u2 ON b.last_updated_by_user_id = u2.id
            WHERE b.id = :id LIMIT 1
        ');
        $stmt->execute(['id' => $id]);
        $booking = $stmt->fetch();

        if (!$booking) {
            Response::error('Booking not found.', 404);
            return;
        }

        // Fetch assignment history
        $assignStmt = $db->prepare('
            SELECT ba.*, d.name AS driver_name, u.full_name AS assigned_by_name
            FROM booking_assignments ba
            LEFT JOIN drivers d ON ba.driver_id = d.id
            LEFT JOIN users u ON ba.assigned_by_user_id = u.id
            WHERE ba.booking_id = :id
            ORDER BY ba.created_at DESC
        ');
        $assignStmt->execute(['id' => $id]);
        $booking['assignment_history'] = $assignStmt->fetchAll();

        Response::success($booking);
    }

    public function store(): void
    {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        // Validation
        $errors = [];
        $pickupDate = trim($input['pickup_date'] ?? '');
        $pickupTime = trim($input['pickup_time'] ?? '');
        $passengerName = trim($input['passenger_name'] ?? '');
        $passengerPhone = trim($input['passenger_phone'] ?? '');
        $pickupLocation = trim($input['pickup_location'] ?? '');
        $dropoffLocation = trim($input['dropoff_location'] ?? '');
        $vehicleType = trim($input['vehicle_type'] ?? 'Sedan');

        if (empty($pickupDate)) $errors['pickup_date'] = 'Pickup date is required.';
        if (empty($pickupTime)) $errors['pickup_time'] = 'Pickup time in 24-hour format is required.';
        if (empty($passengerName)) $errors['passenger_name'] = 'Passenger name is required.';
        if (empty($passengerPhone)) $errors['passenger_phone'] = 'Passenger mobile number with country code is required.';
        if (empty($pickupLocation)) $errors['pickup_location'] = 'Pickup location is required.';
        if (empty($dropoffLocation)) $errors['dropoff_location'] = 'Drop-off location is required.';

        if (!empty($errors)) {
            Response::error('Validation failed. Please correct the specified fields.', 422, $errors);
            return;
        }

        // Check for likely duplicate booking (same passenger phone, date, and time within 15 mins)
        $dupStmt = $db->prepare('
            SELECT id, booking_ref FROM bookings 
            WHERE passenger_phone = :phone 
              AND pickup_date = :pdate 
              AND ABS(TIME_TO_SEC(TIMEDIFF(pickup_time, :ptime))) < 900 
              AND status != "Cancelled" 
            LIMIT 1
        ');
        $dupStmt->execute([
            'phone' => $passengerPhone,
            'pdate' => $pickupDate,
            'ptime' => $pickupTime
        ]);
        $existing = $dupStmt->fetch();
        if ($existing && empty($input['allow_duplicate'])) {
            Response::error("A booking for {$passengerPhone} around {$pickupTime} already exists (Ref: {$existing['booking_ref']}).", 409, [
                'duplicate_booking_ref' => $existing['booking_ref'],
                'duplicate_id' => $existing['id']
            ]);
            return;
        }

        // Generate Unique Reference: GT-YYYYMMDD-XXXX
        $datePrefix = date('Ymd', strtotime($pickupDate));
        $randHex = strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));
        $bookingRef = "GT-{$datePrefix}-{$randHex}";

        $db->beginTransaction();
        try {
            $stmt = $db->prepare('
                INSERT INTO bookings (
                    uuid, booking_ref, pickup_date, pickup_time, passenger_name, 
                    passenger_phone, passenger_whatsapp, passenger_email, flight_number, 
                    airline_terminal, pickup_location, dropoff_location, passenger_count, 
                    luggage_count, vehicle_type, assigned_driver_id, assigned_vehicle_id, 
                    booking_source, customer_notes, driver_instructions, status, 
                    internal_remarks, created_by_user_id, last_updated_by_user_id, version
                ) VALUES (
                    UUID(), :booking_ref, :pickup_date, :pickup_time, :passenger_name,
                    :passenger_phone, :passenger_whatsapp, :passenger_email, :flight_number,
                    :airline_terminal, :pickup_location, :dropoff_location, :passenger_count,
                    :luggage_count, :vehicle_type, :assigned_driver_id, :assigned_vehicle_id,
                    :booking_source, :customer_notes, :driver_instructions, :status,
                    :internal_remarks, :created_by_user_id, :last_updated_by_user_id, 1
                )
            ');

            $assignedDriverId = !empty($input['assigned_driver_id']) ? (int)$input['assigned_driver_id'] : null;
            $assignedVehicleId = !empty($input['assigned_vehicle_id']) ? (int)$input['assigned_vehicle_id'] : null;
            $initialStatus = $assignedDriverId ? 'Assigned' : ($input['status'] ?? 'Pending');

            $stmt->execute([
                'booking_ref'            => $bookingRef,
                'pickup_date'            => $pickupDate,
                'pickup_time'            => $pickupTime,
                'passenger_name'         => $passengerName,
                'passenger_phone'        => $passengerPhone,
                'passenger_whatsapp'     => $input['passenger_whatsapp'] ?? null,
                'passenger_email'        => $input['passenger_email'] ?? null,
                'flight_number'          => !empty($input['flight_number']) ? strtoupper(trim($input['flight_number'])) : null,
                'airline_terminal'       => $input['airline_terminal'] ?? null,
                'pickup_location'        => $pickupLocation,
                'dropoff_location'       => $dropoffLocation,
                'passenger_count'        => max(1, (int)($input['passenger_count'] ?? 1)),
                'luggage_count'          => max(0, (int)($input['luggage_count'] ?? 0)),
                'vehicle_type'           => $vehicleType,
                'assigned_driver_id'     => $assignedDriverId,
                'assigned_vehicle_id'    => $assignedVehicleId,
                'booking_source'         => $input['booking_source'] ?? 'Direct Call',
                'customer_notes'         => $input['customer_notes'] ?? null,
                'driver_instructions'    => $input['driver_instructions'] ?? null,
                'status'                 => $initialStatus,
                'internal_remarks'       => $input['internal_remarks'] ?? null,
                'created_by_user_id'     => $user['id'],
                'last_updated_by_user_id'=> $user['id']
            ]);

            $newBookingId = (int)$db->lastInsertId();

            if ($assignedDriverId) {
                $assignLog = $db->prepare('
                    INSERT INTO booking_assignments (booking_id, driver_id, vehicle_id, assigned_by_user_id, status, notes)
                    VALUES (:bid, :did, :vid, :uid, "Initial Assignment", :notes)
                ');
                $assignLog->execute([
                    'bid'   => $newBookingId,
                    'did'   => $assignedDriverId,
                    'vid'   => $assignedVehicleId,
                    'uid'   => $user['id'],
                    'notes' => 'Assigned upon booking creation'
                ]);
            }

            // Audit log
            $auditStmt = $db->prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, details_json) VALUES (:uid, "CREATE_BOOKING", "bookings", :eid, :ip, :det)');
            $auditStmt->execute([
                'uid' => $user['id'],
                'eid' => $newBookingId,
                'ip'  => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
                'det' => json_encode(['booking_ref' => $bookingRef, 'passenger' => $passengerName, 'status' => $initialStatus])
            ]);

            $db->commit();

            Response::success([
                'id' => $newBookingId,
                'booking_ref' => $bookingRef,
                'status' => $initialStatus
            ], 'Booking successfully created and recorded in database.', 201);
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to create booking: ' . $e->getMessage(), 500);
        }
    }

    public function update(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        // Fetch existing booking with current version for optimistic concurrency control
        $stmt = $db->prepare('SELECT * FROM bookings WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::error('Booking not found.', 404);
            return;
        }

        // Concurrency check
        if (isset($input['version']) && (int)$input['version'] !== (int)$existing['version']) {
            Response::error('This booking was modified by another user. Please refresh and review latest updates.', 409, [
                'current_version' => $existing['version']
            ]);
            return;
        }

        $pickupDate = $input['pickup_date'] ?? $existing['pickup_date'];
        $pickupTime = $input['pickup_time'] ?? $existing['pickup_time'];
        $passengerName = $input['passenger_name'] ?? $existing['passenger_name'];
        $passengerPhone = $input['passenger_phone'] ?? $existing['passenger_phone'];
        $pickupLocation = $input['pickup_location'] ?? $existing['pickup_location'];
        $dropoffLocation = $input['dropoff_location'] ?? $existing['dropoff_location'];
        $vehicleType = $input['vehicle_type'] ?? $existing['vehicle_type'];
        $passengerCount = isset($input['passenger_count']) ? (int)$input['passenger_count'] : (int)$existing['passenger_count'];
        $luggageCount = isset($input['luggage_count']) ? (int)$input['luggage_count'] : (int)$existing['luggage_count'];
        $assignedDriverId = array_key_exists('assigned_driver_id', $input) ? ($input['assigned_driver_id'] ? (int)$input['assigned_driver_id'] : null) : $existing['assigned_driver_id'];
        $assignedVehicleId = array_key_exists('assigned_vehicle_id', $input) ? ($input['assigned_vehicle_id'] ? (int)$input['assigned_vehicle_id'] : null) : $existing['assigned_vehicle_id'];

        $db->beginTransaction();
        try {
            $updateStmt = $db->prepare('
                UPDATE bookings SET
                    pickup_date = :pickup_date,
                    pickup_time = :pickup_time,
                    passenger_name = :passenger_name,
                    passenger_phone = :passenger_phone,
                    passenger_whatsapp = :passenger_whatsapp,
                    passenger_email = :passenger_email,
                    flight_number = :flight_number,
                    airline_terminal = :airline_terminal,
                    pickup_location = :pickup_location,
                    dropoff_location = :dropoff_location,
                    passenger_count = :passenger_count,
                    luggage_count = :luggage_count,
                    vehicle_type = :vehicle_type,
                    assigned_driver_id = :assigned_driver_id,
                    assigned_vehicle_id = :assigned_vehicle_id,
                    booking_source = :booking_source,
                    customer_notes = :customer_notes,
                    driver_instructions = :driver_instructions,
                    internal_remarks = :internal_remarks,
                    last_updated_by_user_id = :updater_id,
                    version = version + 1,
                    updated_at = NOW()
                WHERE id = :id AND version = :version
            ');

            $updateStmt->execute([
                'id'                  => $id,
                'version'             => $existing['version'],
                'pickup_date'         => $pickupDate,
                'pickup_time'         => $pickupTime,
                'passenger_name'      => $passengerName,
                'passenger_phone'     => $passengerPhone,
                'passenger_whatsapp'  => $input['passenger_whatsapp'] ?? $existing['passenger_whatsapp'],
                'passenger_email'     => $input['passenger_email'] ?? $existing['passenger_email'],
                'flight_number'       => !empty($input['flight_number']) ? strtoupper(trim($input['flight_number'])) : $existing['flight_number'],
                'airline_terminal'    => $input['airline_terminal'] ?? $existing['airline_terminal'],
                'pickup_location'     => $pickupLocation,
                'dropoff_location'    => $dropoffLocation,
                'passenger_count'     => $passengerCount,
                'luggage_count'       => $luggageCount,
                'vehicle_type'        => $vehicleType,
                'assigned_driver_id'  => $assignedDriverId,
                'assigned_vehicle_id' => $assignedVehicleId,
                'booking_source'      => $input['booking_source'] ?? $existing['booking_source'],
                'customer_notes'      => $input['customer_notes'] ?? $existing['customer_notes'],
                'driver_instructions' => $input['driver_instructions'] ?? $existing['driver_instructions'],
                'internal_remarks'    => $input['internal_remarks'] ?? $existing['internal_remarks'],
                'updater_id'          => $user['id']
            ]);

            // Track driver re-assignment
            if ($assignedDriverId && $assignedDriverId !== $existing['assigned_driver_id']) {
                $assignLog = $db->prepare('
                    INSERT INTO booking_assignments (booking_id, driver_id, vehicle_id, assigned_by_user_id, status, notes)
                    VALUES (:bid, :did, :vid, :uid, "Reassigned", :notes)
                ');
                $assignLog->execute([
                    'bid'   => $id,
                    'did'   => $assignedDriverId,
                    'vid'   => $assignedVehicleId,
                    'uid'   => $user['id'],
                    'notes' => $input['assignment_notes'] ?? 'Updated via booking editor'
                ]);

                // Automatically advance status from Pending to Assigned if applicable
                if ($existing['status'] === 'Pending') {
                    $stStmt = $db->prepare('UPDATE bookings SET status = "Assigned" WHERE id = :id');
                    $stStmt->execute(['id' => $id]);
                }
            }

            // Audit
            $auditStmt = $db->prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, details_json) VALUES (:uid, "UPDATE_BOOKING", "bookings", :eid, :ip, :det)');
            $auditStmt->execute([
                'uid' => $user['id'],
                'eid' => $id,
                'ip'  => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
                'det' => json_encode(['booking_ref' => $existing['booking_ref'], 'updated_by' => $user['full_name']])
            ]);

            $db->commit();
            Response::success(['id' => $id, 'version' => (int)$existing['version'] + 1], 'Booking updated successfully.');
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to update booking: ' . $e->getMessage(), 500);
        }
    }

    public function assign(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::requireDispatcherOrAdmin($user);
        $db = Database::getConnection();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $driverId = !empty($input['driver_id']) ? (int)$input['driver_id'] : null;
        $vehicleId = !empty($input['vehicle_id']) ? (int)$input['vehicle_id'] : null;
        $notes = trim($input['notes'] ?? '');

        if (!$driverId) {
            Response::error('Driver selection is required for assignment.', 422);
            return;
        }

        // Fetch booking
        $stmt = $db->prepare('SELECT * FROM bookings WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $booking = $stmt->fetch();

        if (!$booking) {
            Response::error('Booking not found.', 404);
            return;
        }

        // Check for schedule conflict (same driver assigned to another trip within 2 hours on same date)
        $conflictStmt = $db->prepare('
            SELECT booking_ref, pickup_time FROM bookings 
            WHERE assigned_driver_id = :did 
              AND pickup_date = :pdate 
              AND id != :bid 
              AND status NOT IN ("Completed", "Cancelled")
              AND ABS(TIME_TO_SEC(TIMEDIFF(pickup_time, :ptime))) < 7200
            LIMIT 1
        ');
        $conflictStmt->execute([
            'did'   => $driverId,
            'pdate' => $booking['pickup_date'],
            'bid'   => $id,
            'ptime' => $booking['pickup_time']
        ]);
        $conflict = $conflictStmt->fetch();

        if ($conflict && empty($input['force_assignment'])) {
            Response::error("Conflict warning: This driver is already assigned to trip {$conflict['booking_ref']} at {$conflict['pickup_time']}.", 409, [
                'conflict_type' => 'driver_schedule_conflict',
                'conflict_booking' => $conflict['booking_ref'],
                'conflict_time' => $conflict['pickup_time']
            ]);
            return;
        }

        $db->beginTransaction();
        try {
            $upStmt = $db->prepare('
                UPDATE bookings 
                SET assigned_driver_id = :did,
                    assigned_vehicle_id = :vid,
                    status = IF(status = "Pending", "Assigned", status),
                    last_updated_by_user_id = :uid,
                    version = version + 1,
                    updated_at = NOW()
                WHERE id = :id
            ');
            $upStmt->execute([
                'did' => $driverId,
                'vid' => $vehicleId,
                'uid' => $user['id'],
                'id'  => $id
            ]);

            $logStmt = $db->prepare('
                INSERT INTO booking_assignments (booking_id, driver_id, vehicle_id, assigned_by_user_id, status, notes)
                VALUES (:bid, :did, :vid, :uid, "Dispatched", :notes)
            ');
            $logStmt->execute([
                'bid'   => $id,
                'did'   => $driverId,
                'vid'   => $vehicleId,
                'uid'   => $user['id'],
                'notes' => $notes ?: 'Driver assigned via Dispatch Board'
            ]);

            $db->commit();
            Response::success(null, 'Driver assigned successfully.');
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to assign driver: ' . $e->getMessage(), 500);
        }
    }

    public function updateStatus(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $validStatuses = [
            'Pending', 'Confirmed', 'Assigned', 'Driver En Route',
            'Arrived', 'Passenger Picked Up', 'Completed', 'Cancelled', 'No Show'
        ];

        $newStatus = trim($input['status'] ?? '');
        $reason = trim($input['reason'] ?? '');

        if (!in_array($newStatus, $validStatuses, true)) {
            Response::error('Invalid booking status provided.', 422);
            return;
        }

        $stmt = $db->prepare('SELECT * FROM bookings WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $booking = $stmt->fetch();

        if (!$booking) {
            Response::error('Booking not found.', 404);
            return;
        }

        $db->beginTransaction();
        try {
            $cancelledAt = ($newStatus === 'Cancelled') ? date('Y-m-d H:i:s') : null;

            $upStmt = $db->prepare('
                UPDATE bookings 
                SET status = :status,
                    cancelled_at = :cat,
                    cancellation_reason = :creason,
                    last_updated_by_user_id = :uid,
                    version = version + 1,
                    updated_at = NOW()
                WHERE id = :id
            ');
            $upStmt->execute([
                'status'  => $newStatus,
                'cat'     => $cancelledAt,
                'creason' => $reason ?: null,
                'uid'     => $user['id'],
                'id'      => $id
            ]);

            // Audit
            $auditStmt = $db->prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, details_json) VALUES (:uid, "STATUS_CHANGE", "bookings", :eid, :ip, :det)');
            $auditStmt->execute([
                'uid' => $user['id'],
                'eid' => $id,
                'ip'  => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
                'det' => json_encode(['from' => $booking['status'], 'to' => $newStatus, 'reason' => $reason])
            ]);

            $db->commit();
            Response::success(['id' => $id, 'status' => $newStatus], "Trip status updated to '{$newStatus}'.");
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to update status: ' . $e->getMessage(), 500);
        }
    }
}
