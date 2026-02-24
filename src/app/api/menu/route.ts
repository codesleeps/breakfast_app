import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { NextResponse } from 'next/server';

// Mock menu items for development without database
const MOCK_MENU_ITEMS = [
  // Main dishes - Hot
  { id: '1', name: 'Kitchen Special', description: '2 x fried eggs, 4 x fish fingers, baked beans, fried plantains and 3 x fried dumplings', price_pence: 500, category: 'Hot', image_url: '/kitchen_special.jpg', available: true, sort_order: 1, is_extra: false },
  { id: '2', name: 'Scrambled Eggs with Flatbread', description: 'Fluffy scrambled eggs, tomatoes and cheese served with homemade flatbread', price_pence: 300, category: 'Hot', image_url: '/flatbread-scramble-eggs-2100x963.jpg', available: true, sort_order: 2, is_extra: false },
  { id: '3', name: 'Bacon Flatbread', description: 'Crispy bacon tomatoes onions in a fresh homemade flatbread', price_pence: 350, category: 'Hot', image_url: '/breakfast-flatbreads.png', available: true, sort_order: 3, is_extra: false },
  { id: '4', name: 'Poached Eggs with Flatbread', description: 'Perfectly poached eggs served with broccoli tomatoes homemade wholemeal flatbread', price_pence: 300, category: 'Hot', image_url: '/Poached-Eggs-with-Broccoli-Tomatoes-Wholemeal-Flatbread-Recipe-munchiie.com_.jpg', available: true, sort_order: 4, is_extra: false },
  // Main dishes - Light
  { id: '5', name: 'Spicy Flatbread', description: 'Homemade flatbread filled with spicy ground chicken, onions and peppers topped with cheese and salad', price_pence: 400, category: 'Light', image_url: '/open_flatbread.jpg', available: true, sort_order: 5, is_extra: false },
  { id: '6', name: 'Greek Yogurt Bowl', description: 'Creamy yogurt with honey, granola and fresh berries', price_pence: 300, category: 'Light', image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop', available: true, sort_order: 6, is_extra: false },
  { id: '7', name: 'Oats Porridge', description: 'Freshly prepared oats with milk and toppings', price_pence: 250, category: 'Light', image_url: '/oats.jpg', available: true, sort_order: 7, is_extra: false },
  { id: '8', name: 'Cornmeal Porridge', description: 'Freshly prepared cornmeal with milk and toppings', price_pence: 250, category: 'Light', image_url: '/cornmeal.webp', available: true, sort_order: 8, is_extra: false },
  // Drinks
  { id: '9', name: 'Filter Coffee', description: 'Rich, smooth house blend', price_pence: 150, category: 'Drinks', image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop', available: true, sort_order: 9, is_extra: false },
  { id: '10', name: 'Tea', description: 'English Breakfast tea with milk', price_pence: 100, category: 'Drinks', image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop', available: true, sort_order: 10, is_extra: false },
  { id: '11', name: 'Orange Juice', description: 'Freshly squeezed orange juice', price_pence: 200, category: 'Drinks', image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop', available: true, sort_order: 11, is_extra: false },
  { id: '12', name: 'Cappuccino', description: 'Espresso with steamed milk foam', price_pence: 200, category: 'Drinks', image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200&h=200&fit=crop', available: true, sort_order: 12, is_extra: false },
  // Extras
  { id: 'ex1', name: 'Extra Fried Egg', description: 'Single fried egg', price_pence: 50, category: 'Extras', image_url: '/eggs_boiled_fried_scrambled_poached.jpg', available: true, sort_order: 101, is_extra: true },
  { id: 'ex2', name: 'Extra Scrambled Egg', description: 'Portion of scrambled eggs', price_pence: 75, category: 'Extras', image_url: '/eggs_boiled_fried_scrambled_poached.jpg', available: true, sort_order: 102, is_extra: true },
  { id: 'ex3', name: 'Extra Mushrooms', description: 'Sautéed mushrooms', price_pence: 50, category: 'Extras', image_url: null, available: true, sort_order: 103, is_extra: true },
  { id: 'ex4', name: 'Extra Tomatoes', description: 'Grilled tomatoes', price_pence: 50, category: 'Extras', image_url: null, available: true, sort_order: 104, is_extra: true },
  { id: 'ex5', name: 'Extra Cheese', description: 'Cheddar cheese', price_pence: 50, category: 'Extras', image_url: null, available: true, sort_order: 105, is_extra: true },
  { id: 'ex6', name: 'Extra Fish Fingers', description: '2 x fish fingers', price_pence: 100, category: 'Extras', image_url: '/fish_fingers.png', available: true, sort_order: 106, is_extra: true },
  { id: 'ex7', name: 'Extra Fried Dumplings', description: '2 x fried dumplings', price_pence: 100, category: 'Extras', image_url: '/fried_dumplings.jpg', available: true, sort_order: 107, is_extra: true },
  { id: 'ex8', name: 'Extra Plantains', description: 'Fried plantains', price_pence: 75, category: 'Extras', image_url: '/fried_plantains.png', available: true, sort_order: 108, is_extra: true },
  { id: 'ex9', name: 'Extra Baked Beans', description: 'Portion of baked beans', price_pence: 50, category: 'Extras', image_url: null, available: true, sort_order: 109, is_extra: true },
];

export async function GET() {
  try {
    const items = await queryInternalDatabase(
      'SELECT id, name, description, price_pence, category, image_url, available, sort_order, is_extra FROM menu_items WHERE available = true ORDER BY sort_order ASC'
    );
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch menu items, using mock data:', error);
    // Return mock data when database is not available
    return NextResponse.json(MOCK_MENU_ITEMS);
  }
}
