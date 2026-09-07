CREATE OR REPLACE FUNCTION mark_all_user_notifications_as_read(
    p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
    affected_count INTEGER;
BEGIN

    -- Insert missing tracking rows for this user's notifications.
    INSERT INTO user_notification_track (
        notification_id,
        user_id,
        is_read
    )
    SELECT
        notification_id,
        p_user_id,
        TRUE
    FROM get_user_notifications(p_user_id, 10000)
    ON CONFLICT (notification_id, user_id)
    DO UPDATE SET is_read = TRUE;

    GET DIAGNOSTICS affected_count = ROW_COUNT;

    RETURN affected_count;

END;
$$;