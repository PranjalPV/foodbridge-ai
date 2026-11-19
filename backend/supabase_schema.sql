-- =========================================================================
-- FoodBridge AI - Supabase PostgreSQL Cloud Schema
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =========================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- PostGIS for geospatial location queries (find food within X km)
CREATE EXTENSION IF NOT EXISTS "postgis";
-- pgvector for storing RAG regulatory embeddings
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. User Profiles Table (Roles: restaurant, ngo, volunteer)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('restaurant', 'ngo', 'volunteer', 'admin')),
    full_name TEXT NOT NULL,
    org_name TEXT,
    phone TEXT,
    address TEXT,
    latitude DOUBLE PRECISION DEFAULT 26.8467,
    longitude DOUBLE PRECISION DEFAULT 80.9462,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Food Donations Table
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    restaurant_name TEXT NOT NULL,
    food_name TEXT NOT NULL,
    category TEXT NOT NULL,
    food_type TEXT NOT NULL CHECK (food_type IN ('Vegetarian', 'Non-Vegetarian', 'Vegan')),
    quantity INTEGER NOT NULL,
    unit TEXT DEFAULT 'Meals',
    cooked_time TIMESTAMP WITH TIME ZONE NOT NULL,
    safe_until TIMESTAMP WITH TIME ZONE NOT NULL,
    urgency_score TEXT NOT NULL CHECK (urgency_score IN ('CRITICAL', 'MODERATE', 'SAFE')),
    status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'CLAIMED', 'DELIVERED', 'EXPIRED')),
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    co2_saved_kg NUMERIC(6, 2) DEFAULT 0.0,
    fssai_compliance TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Claims and Deliveries Tracking
CREATE TABLE IF NOT EXISTS public.claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_id UUID REFERENCES public.donations(id) ON DELETE CASCADE,
    ngo_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    volunteer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED')),
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- 5. RAG Knowledge Base Table (For Vector Similarity Search)
CREATE TABLE IF NOT EXISTS public.rag_knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chunk_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    section TEXT NOT NULL,
    content TEXT NOT NULL,
    keywords TEXT[],
    embedding vector(768) -- Matches Gemini text-embedding-004 dimensions
);

-- 6. Spatial Function: Find Donations near coordinate within X kilometers
CREATE OR REPLACE FUNCTION get_nearby_donations(user_lat DOUBLE PRECISION, user_lng DOUBLE PRECISION, radius_km DOUBLE PRECISION)
RETURNS TABLE (
    id UUID,
    food_name TEXT,
    restaurant_name TEXT,
    quantity INTEGER,
    urgency_score TEXT,
    distance_km DOUBLE PRECISION
)
LANGUAGE sql
AS $$
    SELECT 
        d.id,
        d.food_name,
        d.restaurant_name,
        d.quantity,
        d.urgency_score,
        ROUND(
            (6371 * acos(
                cos(radians(user_lat)) * cos(radians(d.latitude)) *
                cos(radians(d.longitude) - radians(user_lng)) +
                sin(radians(user_lat)) * sin(radians(d.latitude))
            ))::numeric, 2
        )::DOUBLE PRECISION AS distance_km
    FROM public.donations d
    WHERE d.status = 'AVAILABLE'
      AND (6371 * acos(
            cos(radians(user_lat)) * cos(radians(d.latitude)) *
            cos(radians(d.longitude) - radians(user_lng)) +
            sin(radians(user_lat)) * sin(radians(d.latitude))
      )) <= radius_km
    ORDER BY distance_km ASC;
$$;

-- 7. Enable Realtime Broadcasting on Donations Table
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;

-- 8. Seed Initial Demonstration Records
INSERT INTO public.profiles (email, role, full_name, org_name, phone, address, latitude, longitude)
VALUES 
    ('restaurant@foodbridge.org', 'restaurant', 'Chef Kapoor', 'Royal Spice Grand', '+91 98765 11111', 'Hazratganj, Lucknow', 26.8467, 80.9462),
    ('ngo@foodbridge.org', 'ngo', 'Dr. Ananya Sharma', 'Asha Children Home', '+91 98765 22222', 'Gomti Nagar, Lucknow', 26.8550, 80.9920),
    ('volunteer@foodbridge.org', 'volunteer', 'Arjun Singh', 'Active Volunteer', '+91 98765 33333', 'Aliganj, Lucknow', 26.8480, 80.9450)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.donations (restaurant_name, food_name, category, food_type, quantity, cooked_time, safe_until, urgency_score, status, address, latitude, longitude, co2_saved_kg, fssai_compliance)
VALUES
    ('Royal Spice Grand', 'Fresh Steamed Vegetable Biryani', 'Rice & Biryani', 'Vegetarian', 45, now() - INTERVAL '1 hour', now() + INTERVAL '2.5 hour', 'CRITICAL', 'AVAILABLE', 'Hazratganj, Lucknow', 26.8467, 80.9462, 112.50, 'High-risk rice item within FSSAI danger zone. Emergency 2h distribution protocol active.'),
    ('Awadh Delights', 'Dal Makhani & Naan', 'Rice & Biryani', 'Vegetarian', 30, now() - INTERVAL '3 hours', now() + INTERVAL '45 minutes', 'CRITICAL', 'AVAILABLE', 'Gomti Nagar, Lucknow', 26.8530, 80.9980, 75.00, 'Perishable dairy item nearing 4-hour ambient limit.'),
    ('Annapurna Kitchen', 'Whole Wheat Chapatis & Dry Sabzi', 'Roti & Chapati', 'Vegetarian', 80, now() - INTERVAL '2 hours', now() + INTERVAL '8 hours', 'SAFE', 'AVAILABLE', 'Aliganj, Lucknow', 26.8850, 80.9450, 200.00, 'Low-risk grain food meeting FSSAI Schedule I safety requirements.');
