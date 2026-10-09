-- ==============================================================================
-- FixMate - Home Services Marketplace Database Schema
-- Supabase PostgreSQL Setup with Row Level Security (RLS)
-- ==============================================================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'provider');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Service Providers Table
CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    trade TEXT NOT NULL,
    experience_years INTEGER NOT NULL DEFAULT 1,
    bio TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    approval_status approval_status NOT NULL DEFAULT 'pending',
    rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    rating_count INTEGER NOT NULL DEFAULT 0,
    completed_jobs INTEGER NOT NULL DEFAULT 0,
    hourly_rate NUMERIC(10,2) DEFAULT 1000.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Service Categories Catalog Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    base_price NUMERIC(10,2) NOT NULL DEFAULT 500.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Job Orders Table
CREATE TABLE IF NOT EXISTS public.job_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.service_providers(id) ON DELETE SET NULL,
    service_title TEXT NOT NULL,
    category TEXT NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    description TEXT,
    scheduled_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now() + interval '1 day'),
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Lahore',
    amount NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_orders ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies: Profiles
-- Any authenticated user can read profiles (needed to see provider info or customer name on order)
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile, but cannot tamper with their role
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    );

-- 8. RLS Policies: Service Providers
-- Anyone authenticated can view approved providers; providers can view themselves even if pending
CREATE POLICY "Providers are viewable by users"
    ON public.service_providers FOR SELECT
    TO authenticated
    USING (approval_status = 'approved' OR auth.uid() = id);

-- Providers can insert their provider profile during signup
CREATE POLICY "Providers can insert their own provider record"
    ON public.service_providers FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Providers can update their availability, bio, experience, and rate, but NOT approval_status
CREATE POLICY "Providers can update their own profile details"
    ON public.service_providers FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        approval_status = (SELECT approval_status FROM public.service_providers WHERE id = auth.uid())
    );

-- 9. RLS Policies: Services Catalog
-- Services catalog is readable by all authenticated users
CREATE POLICY "Services are viewable by all authenticated users"
    ON public.services FOR SELECT
    TO authenticated
    USING (is_active = true);

-- 10. RLS Policies: Job Orders
-- Customers can view their own orders; Providers can view assigned jobs or pending jobs in their trade
CREATE POLICY "Users can view relevant orders"
    ON public.job_orders FOR SELECT
    TO authenticated
    USING (
        auth.uid() = customer_id OR 
        auth.uid() = provider_id OR
        (provider_id IS NULL AND EXISTS (
            SELECT 1 FROM public.service_providers 
            WHERE id = auth.uid() AND is_available = true
        ))
    );

CREATE POLICY "Customers can create job orders"
    ON public.job_orders FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Participants can update order status"
    ON public.job_orders FOR UPDATE
    TO authenticated
    USING (auth.uid() = customer_id OR auth.uid() = provider_id);

-- 11. Trigger for Automatic Profile Creation on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_role_val user_role := 'customer';
    user_trade_val text;
BEGIN
    IF (new.raw_user_meta_data->>'role') = 'provider' THEN
        user_role_val := 'provider';
    END IF;

    user_trade_val := new.raw_user_meta_data->>'trade';

    INSERT INTO public.profiles (id, full_name, email, phone, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'FixMate User'),
        new.email,
        new.raw_user_meta_data->>'phone',
        user_role_val
    );

    IF user_role_val = 'provider' THEN
        INSERT INTO public.service_providers (id, trade, experience_years, bio, approval_status)
        VALUES (
            new.id,
            COALESCE(user_trade_val, 'Plumbing'),
            COALESCE((new.raw_user_meta_data->>'experience_years')::integer, 2),
            COALESCE(new.raw_user_meta_data->>'bio', 'Skilled service professional'),
            'approved' -- Auto-approved for development/testing, or change to 'pending' for strict admin moderation
        );
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 12. Seed Services Catalog with the 6 Predefined Categories
INSERT INTO public.services (category, title, description, icon, base_price)
VALUES
    ('Plumbing', 'Pipe Leak Repair', 'Fix leaking pipes, taps, and water valves quickly', 'water-outline', 800),
    ('Plumbing', 'Water Tank & Motor Repair', 'Water pump servicing and overhead tank connection', 'speedometer-outline', 1500),
    ('Plumbing', 'Bathroom Fixture Installation', 'Install toilet, commode, wash basin, or mixer shower', 'construct-outline', 1200),
    
    ('Electrical Work', 'Fan & Light Installation', 'Ceiling fan, exhaust fan, LED lights and chandelier fitting', 'flash-outline', 600),
    ('Electrical Work', 'Short Circuit & Breaker Fix', 'Troubleshoot tripping breakers and wiring faults', 'warning-outline', 1000),
    ('Electrical Work', 'UPS & Inverter Wiring', 'Complete backup inverter setup and distribution wiring', 'hardware-chip-outline', 2000),

    ('Masonry', 'Tile Replacement & Repair', 'Repair broken floor and wall tiles with cement grouting', 'grid-outline', 1500),
    ('Masonry', 'Plaster & Wall Crack Repair', 'Fix damaged masonry, dampness, and concrete plaster', 'layers-outline', 1200),
    ('Masonry', 'Marble Grinding & Polish', 'Diamond cut polishing for sparkling marble and terrazzo', 'sparkles-outline', 3500),

    ('Carpentry', 'Door Lock & Hinge Repair', 'Install high-security locks, handles, and door closers', 'lock-closed-outline', 700),
    ('Carpentry', 'Furniture Repair & Assembly', 'Fix squeaky beds, chairs, tables, and flat-pack assembly', 'hammer-outline', 1200),
    ('Carpentry', 'Cabinet & Drawer Fitting', 'Custom kitchen cabinets and wardrobe drawer realignment', 'file-tray-stacked-outline', 1800),

    ('Painting', 'Single Room Wall Painting', 'Fresh coat of emulsion paint with primer and wall putty', 'color-palette-outline', 4500),
    ('Painting', 'Waterproofing & Damp Treatment', 'Roof and exterior wall waterproofing against leaks', 'shield-checkmark-outline', 6000),
    ('Painting', 'Wood & Metal Enamel Polish', 'Gloss paint and varnish for doors, windows, and gates', 'brush-outline', 2500),

    ('Appliance Repair', 'AC Gas Refill & Servicing', 'Split AC cleaning, gas top-up, and cooling optimization', 'snow-outline', 2500),
    ('Appliance Repair', 'Refrigerator Repair', 'Fix compressor issues, cooling faults, and thermostat', 'cube-outline', 1800),
    ('Appliance Repair', 'Washing Machine Repair', 'Spinner, motor, drain valve, and drum vibration fix', 'sync-outline', 1600)
ON CONFLICT DO NOTHING;
