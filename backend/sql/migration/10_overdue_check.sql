CREATE OR REPLACE FUNCTION create_overdue_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
    inserted_count INTEGER;
BEGIN
    INSERT INTO notifications (
        service_request_id,
        type,
        message
    )
    SELECT
        sr.id,
        'OVERDUE',
        format(
            'Service request #SR-%s for %s was expected by %s.',
            sr.id,
            COALESCE(sr.device_info, 'device'),
            to_char(
                sr.expected_delivery_at,
                'YYYY-MM-DD HH24:MI:SS'
            )
        )
    FROM service_requests sr
    WHERE sr.expected_delivery_at IS NOT NULL
      AND sr.expected_delivery_at < NOW()
      AND sr.status NOT IN (
          'COMPLETED',
          'CANCELLED',
          'FAILED',
          'READY_FOR_DELIVERY'
      )
      AND NOT EXISTS (
          SELECT 1
          FROM notifications n
          WHERE n.type = 'OVERDUE'
            AND n.service_request_id = sr.id
      );

    GET DIAGNOSTICS inserted_count = ROW_COUNT;

    RETURN inserted_count;
END;
$$;



