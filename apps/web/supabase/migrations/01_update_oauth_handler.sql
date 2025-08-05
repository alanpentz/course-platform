-- Update the handle_new_user function to better handle OAuth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)  -- Use email prefix as fallback
        ),
        COALESCE(
            (NEW.raw_user_meta_data->>'role')::user_role,
            'student'::user_role  -- Default to student role
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger already exists from the initial migration, so we don't need to recreate it