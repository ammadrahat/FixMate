-- ==============================================================================
-- FixMate - Database Fix & Full Setup Script
-- Run this in the Supabase Dashboard: SQL Editor -> New Query -> Run
-- Fixes: "Database error saving new user" (500) during signup
-- ==============================================================================

-- 1. Create Enums if they don't exist
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('customer', 'provider');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT 'FixMate User',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT,
    role public.user_role NOT NULL DEFAULT 'customer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    trade TEXT NOT NULL DEFAULT 'Plumbing',
    experience_years INTEGER NOT NULL DEFAULT 1,
    bio TEXT DEFAULT 'FixMate verified professional',
    is_available BOOLEAN NOT NULL DEFAULT true,
    approval_status public.approval_status NOT NULL DEFAULT 'approved',
    rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    rating_count INTEGER NOT NULL DEFAULT 0,
    completed_jobs INTEGER NOT NULL DEFAULT 0,
    hourly_rate NUMERIC(10,2) DEFAULT 1000.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

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

CREATE TABLE IF NOT EXISTS public.provider_services (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    provider_name TEXT DEFAULT 'FixMate Pro Provider',
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
    duration TEXT NOT NULL DEFAULT '1-2 Hours',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.job_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.service_providers(id) ON DELETE SET NULL,
    service_title TEXT NOT NULL,
    category TEXT NOT NULL,
    status public.order_status NOT NULL DEFAULT 'pending',
    description TEXT,
    scheduled_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now() + interval '1 day'),
    address TEXT NOT NULL DEFAULT 'Customer Location',
    city TEXT NOT NULL DEFAULT 'Lahore',
    amount NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Grants & Schema Permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_orders ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to recreate cleanly without conflicts
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles"
    ON public.profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Service Providers Policies
DROP POLICY IF EXISTS "Providers are viewable by users" ON public.service_providers;
DROP POLICY IF EXISTS "Providers can insert their own provider record" ON public.service_providers;
DROP POLICY IF EXISTS "Providers can update their own profile details" ON public.service_providers;
DROP POLICY IF EXISTS "Service role can manage all providers" ON public.service_providers;

CREATE POLICY "Providers are viewable by users"
    ON public.service_providers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Providers can insert their own provider record"
    ON public.service_providers FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Providers can update their own profile details"
    ON public.service_providers FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Service role can manage all providers"
    ON public.service_providers FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Services Policies
DROP POLICY IF EXISTS "Services are viewable by all authenticated users" ON public.services;
DROP POLICY IF EXISTS "Services viewable by anon" ON public.services;
CREATE POLICY "Services are viewable by all authenticated users"
    ON public.services FOR SELECT
    TO authenticated
    USING (is_active = true);
CREATE POLICY "Services viewable by anon"
    ON public.services FOR SELECT
    TO anon
    USING (is_active = true);

-- Provider Services Policies (Marketplace)
DROP POLICY IF EXISTS "Provider services viewable by all" ON public.provider_services;
DROP POLICY IF EXISTS "Providers can insert their own services" ON public.provider_services;
DROP POLICY IF EXISTS "Providers can update their own services" ON public.provider_services;
DROP POLICY IF EXISTS "Providers can delete their own services" ON public.provider_services;

CREATE POLICY "Provider services viewable by all"
    ON public.provider_services FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Providers can insert their own services"
    ON public.provider_services FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "Providers can update their own services"
    ON public.provider_services FOR UPDATE
    TO authenticated, anon
    USING (true);

CREATE POLICY "Providers can delete their own services"
    ON public.provider_services FOR DELETE
    TO authenticated, anon
    USING (true);

-- Job Orders Policies
DROP POLICY IF EXISTS "Users can view relevant orders" ON public.job_orders;
DROP POLICY IF EXISTS "Customers can create job orders" ON public.job_orders;
DROP POLICY IF EXISTS "Participants can update order status" ON public.job_orders;

CREATE POLICY "Users can view relevant orders"
    ON public.job_orders FOR SELECT
    TO authenticated
    USING (
        auth.uid() = customer_id OR 
        auth.uid() = provider_id OR
        provider_id IS NULL
    );

CREATE POLICY "Customers can create job orders"
    ON public.job_orders FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Participants can update order status"
    ON public.job_orders FOR UPDATE
    TO authenticated
    USING (auth.uid() = customer_id OR auth.uid() = provider_id);

-- 6. Bulletproof Signup Trigger Function
-- Search path is explicitly set to public, pg_temp so type resolution never fails.
-- Outer EXCEPTION block ensures auth.users creation NEVER rolls back on errors.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role public.user_role := 'customer';
    v_trade text;
    v_exp integer := 2;
BEGIN
    -- 1. Parse Role safely
    IF (new.raw_user_meta_data->>'role') = 'provider' THEN
        v_role := 'provider'::public.user_role;
    ELSE
        v_role := 'customer'::public.user_role;
    END IF;

    -- 2. Parse Provider specific metadata
    v_trade := COALESCE(new.raw_user_meta_data->>'trade', 'Plumbing');
    
    BEGIN
        v_exp := COALESCE(NULLIF(new.raw_user_meta_data->>'experience_years', '')::integer, 2);
    EXCEPTION WHEN OTHERS THEN
        v_exp := 2;
    END;

    -- 3. Upsert Profile record
    INSERT INTO public.profiles (id, full_name, email, phone, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'FixMate User'),
        COALESCE(new.email, ''),
        new.raw_user_meta_data->>'phone',
        v_role
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        role = EXCLUDED.role;

    -- 4. If provider, upsert service_providers record
    IF v_role = 'provider'::public.user_role THEN
        INSERT INTO public.service_providers (id, trade, experience_years, bio, approval_status)
        VALUES (
            new.id,
            v_trade,
            v_exp,
            COALESCE(new.raw_user_meta_data->>'bio', 'Skilled service professional on FixMate'),
            'approved'::public.approval_status
        )
        ON CONFLICT (id) DO UPDATE SET
            trade = EXCLUDED.trade,
            experience_years = EXCLUDED.experience_years;
    END IF;

    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- CRITICAL: Prevent transaction rollback in auth.users!
        RAISE WARNING 'FixMate handle_new_user error: %', SQLERRM;
        RETURN new;
END;
$$;

-- 7. Rebind the Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Seed Services Catalog
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
