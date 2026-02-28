-- Breakfast App Database Schema for Neon PostgreSQL
-- Run this in your Neon SQL Editor

-- Auth tables (better-auth)
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified BOOLEAN DEFAULT false,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_pence INTEGER NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    is_extra BOOLEAN DEFAULT false
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_name TEXT NOT NULL,
    flat_number TEXT,
    mobile_number TEXT,
    address TEXT,
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('delivery', 'collection')),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'donation')),
    total_pence INTEGER NOT NULL,
    user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    item_name TEXT NOT NULL,
    item_price_pence INTEGER NOT NULL
);

-- Kitchen settings table
CREATE TABLE IF NOT EXISTS kitchen_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Order feedback table
CREATE TABLE IF NOT EXISTS order_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default kitchen settings
INSERT INTO kitchen_settings (key, value) VALUES
    ('service_days', '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]'),
    ('service_start_hour', '8'),
    ('service_end_hour', '13')
ON CONFLICT (key) DO NOTHING;

-- Insert sample menu items (optional - remove if you want to add via the admin UI)
INSERT INTO menu_items (id, name, description, price_pence, category, image_url, available, sort_order, is_extra) VALUES
    -- Main dishes - Hot
    ('1', 'Kitchen Special', '2 x fried eggs, 4 x fish fingers, baked beans, fried plantains and 3 x fried dumplings', 500, 'Hot', '/kitchen_special.jpg', true, 1, false),
    ('2', 'Scrambled Eggs with Flatbread', 'Fluffy scrambled eggs, tomatoes and cheese served with homemade flatbread', 300, 'Hot', '/flatbread-scramble-eggs-2100x963.jpg', true, 2, false),
    ('3', 'Bacon Flatbread', 'Crispy bacon tomatoes onions in a fresh homemade flatbread', 350, 'Hot', '/breakfast-flatbreads.png', true, 3, false),
    ('4', 'Poached Eggs with Flatbread', 'Perfectly poached eggs served with broccoli tomatoes homemade wholemeal flatbread', 300, 'Hot', '/Poached-Eggs-with-Broccoli-Tomatoes-Wholemeal-Flatbread-Recipe-munchiie.com_.jpg', true, 4, false),
    -- Main dishes - Light
    ('5', 'Spicy Flatbread', 'Homemade flatbread filled with spicy ground chicken, onions and peppers topped with cheese and salad', 400, 'Light', '/open_flatbread.jpg', true, 5, false),
    ('6', 'Greek Yogurt Bowl', 'Creamy yogurt with honey, granola and fresh berries', 300, 'Light', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop', true, 6, false),
    ('7', 'Oats Porridge', 'Freshly prepared oats with milk and toppings', 250, 'Light', '/Oats.jpg', true, 7, false),
    ('8', 'Cornmeal Porridge', 'Freshly prepared cornmeal with milk and toppings', 250, 'Light', '/cornmeal.webp', true, 8, false),
    -- Drinks
    ('9', 'Filter Coffee', 'Rich, smooth house blend', 150, 'Drinks', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop', true, 9, false),
    ('10', 'Tea', 'English Breakfast tea', 100, 'Drinks', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop', true, 10, false),
    ('11', 'Orange Juice', 'Freshly squeezed orange juice', 200, 'Drinks', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop', true, 11, false),
    ('12', 'Cappuccino', 'Espresso with steamed milk foam', 200, 'Drinks', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200&h=200&fit=crop', true, 12, false),
    -- Extras
    ('ex1', 'Extra Fried Egg', 'Single fried egg', 50, 'Extras', '/eggs_boiled_fried_scrambled_poached.jpg', true, 101, true),
    ('ex2', 'Extra Scrambled Egg', 'Portion of scrambled eggs', 75, 'Extras', '/eggs_boiled_fried_scrambled_poached.jpg', true, 102, true),
    ('ex3', 'Extra Mushrooms', 'Sautéed mushrooms', 50, 'Extras', null, true, 103, true),
    ('ex4', 'Extra Tomatoes', 'Grilled tomatoes', 50, 'Extras', null, true, 104, true),
    ('ex5', 'Extra Cheese', 'Cheddar cheese', 50, 'Extras', null, true, 105, true),
    ('ex6', 'Extra Fish Fingers', '2 x fish fingers', 100, 'Extras', '/fish_fingers.png', true, 106, true),
    ('ex7', 'Extra Fried Dumplings', '2 x fried dumplings', 100, 'Extras', '/fried_dumplings.jpg', true, 107, true),
    ('ex8', 'Extra Plantains', 'Fried plantains', 75, 'Extras', '/fried_plantains.png', true, 108, true),
    ('ex9', 'Extra Baked Beans', 'Portion of baked beans', 50, 'Extras', null, true, 109, true)
ON CONFLICT (id) DO NOTHING;
