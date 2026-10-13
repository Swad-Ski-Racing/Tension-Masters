/* ==========================================================
   Tension Masters — "Build your own" string list
   ----------------------------------------------------------
   price         = what the customer pays per racket (string + labour)
   Suggested price = cost per racket + £15, rounded up to £1.
   Costs are kept private in api/_costs.js (admin only).

   popular: true = shown in the "Popular" picks (default only — the
   admin panel can change which strings are popular, plus prices & sales).

   Colours: { name, hex }. For factory hybrid strings, `mains` is the
   main-string colour and `hex` is the cross-string colour.
   To add a string, copy a line and edit it. Order = order shown.
   ========================================================== */
window.TM_STRINGS = [
  // Yonex
  { id: 'yonex-bg66-ultimax', popular: true, brand: 'Yonex', name: 'BG66 Ultimax', gauge: '0.65mm', character: 'High repulsion, crisp sound', price: 21,
    colours: [{ name: 'White', hex: '#F4F4F2' }, { name: 'Yellow', hex: '#F5E11B' }, { name: 'Orange', hex: '#F47A20' }, { name: 'Black', hex: '#1A1A1A' }] },
  { id: 'yonex-exbolt-63', popular: true, brand: 'Yonex', name: 'Exbolt 63', gauge: '0.63mm', character: 'Fast repulsion, sharp hitting', price: 22,
    colours: [{ name: 'White', hex: '#F4F4F2' }, { name: 'Yellow', hex: '#F5E11B' }, { name: 'Lavender', hex: '#B9A6E0' }] },
  { id: 'yonex-exbolt-65', popular: true, brand: 'Yonex', name: 'Exbolt 65', gauge: '0.65mm', character: 'Repulsion with durability', price: 22,
    colours: [{ name: 'White', hex: '#F4F4F2' }, { name: 'Yellow', hex: '#F5E11B' }, { name: 'Purple', hex: '#6B3FA0' }, { name: 'Blue', hex: '#2F6BD8' }, { name: 'Green', hex: '#3BAA4A' }] },
  { id: 'yonex-exbolt-68', brand: 'Yonex', name: 'Exbolt 68', gauge: '0.68mm', character: 'Durable, controlled power', price: 25,
    colours: [{ name: 'White', hex: '#F4F4F2' }, { name: 'Yellow', hex: '#F5E11B' }, { name: 'Flash Orange', hex: '#FF6A13' }, { name: 'Midnight Blue', hex: '#1C2340' }] },
  { id: 'yonex-bg66-force', brand: 'Yonex', name: 'BG66 Force', gauge: '0.65mm', character: 'Repulsion, tougher than BG66U', price: 22,
    colours: [{ name: 'White', hex: '#F4F4F2' }] },
  { id: 'yonex-aerobite', popular: true, brand: 'Yonex', name: 'Aerobite (hybrid)', gauge: '0.67/0.61mm', character: 'Spin and bite, sharp control', price: 23,
    colours: [{ name: 'White/Red', mains: '#F4F4F2', hex: '#D7263D' }, { name: 'White/Green', mains: '#F4F4F2', hex: '#3BAA4A' }, { name: 'White/Blue', mains: '#F4F4F2', hex: '#2F6BD8' }] },
  { id: 'yonex-aerobite-boost', brand: 'Yonex', name: 'Aerobite Boost (hybrid)', gauge: '0.72/0.61mm', character: 'Spin plus durability', price: 26,
    colours: [{ name: 'Grey/Yellow', mains: '#4A4A4F', hex: '#F5E11B' }] },
  { id: 'yonex-aerosonic', brand: 'Yonex', name: 'Aerosonic', gauge: '0.61mm', character: 'Ultra-thin, max repulsion', price: 23,
    colours: [{ name: 'White', hex: '#F4F4F2' }] },

  // Victor
  { id: 'victor-vbs-66n', popular: true, brand: 'Victor', name: 'VBS-66N', gauge: '0.66mm', character: 'Repulsion, crisp', price: 20,
    colours: [{ name: 'White', hex: '#F4F4F2' }] },
  { id: 'victor-vbs-63', brand: 'Victor', name: 'VBS-63', gauge: '0.63mm', character: 'Thin, high repulsion', price: 20,
    colours: [{ name: 'White', hex: '#F4F4F2' }] },
  { id: 'victor-vbs-70', brand: 'Victor', name: 'VBS-70', gauge: '0.70mm', character: 'Durable, power', price: 23,
    colours: [{ name: 'White', hex: '#F4F4F2' }] },
  { id: 'victor-vbs-69', brand: 'Victor', name: 'VBS-69', gauge: '0.69mm', character: 'Durable, soft feel', price: 22,
    colours: [{ name: 'Purple/Navy', mains: '#4B2E83', hex: '#1F2A55' }] },

  // Li-Ning
  { id: 'lining-no1', brand: 'Li-Ning', name: 'No.1', gauge: '0.65mm', character: 'Repulsion, crisp', price: 24,
    colours: [{ name: 'Black', hex: '#1A1A1A' }, { name: 'White', hex: '#F4F4F2' }] },
  { id: 'lining-no5', brand: 'Li-Ning', name: 'No.5', gauge: '0.69mm', character: 'Durability and repulsion', price: 25,
    colours: [{ name: 'Black', hex: '#1A1A1A' }, { name: 'Dark Purple', hex: '#4B2366' }] },
  { id: 'lining-l67-quick', brand: 'Li-Ning', name: 'L67 Quick', gauge: '0.67mm', character: 'All-round value', price: 21,
    colours: [{ name: 'Milky White', hex: '#F3F0E6' }, { name: 'Neon Yellow', hex: '#E6F21B' }, { name: 'Barbados Beach', hex: '#2BA6C4' }] },

  // Ashaway
  { id: 'ashaway-zymax-62-fire', brand: 'Ashaway', name: 'Zymax 62 Fire', gauge: '0.62mm', character: 'Ultra-thin, max repulsion', price: 20,
    colours: [{ name: 'White', hex: '#F4F4F2' }, { name: 'Orange', hex: '#F47A20' }] },
  { id: 'ashaway-zymax-66-fire', popular: true, brand: 'Ashaway', name: 'Zymax 66 Fire', gauge: '0.66mm', character: 'Crisp all-rounder', price: 20,
    colours: [{ name: 'Orange', hex: '#F47A20' }, { name: 'Pink', hex: '#F06AA6' }, { name: 'White', hex: '#F4F4F2' }] },
  { id: 'ashaway-zymax-64-tx', brand: 'Ashaway', name: 'Zymax 64 TX', gauge: '0.64mm', character: 'Textured, repulsion + control', price: 20,
    colours: [{ name: 'Yellow', hex: '#F5E11B' }, { name: 'White', hex: '#F4F4F2' }, { name: 'Orange', hex: '#F47A20' }] },
  { id: 'ashaway-zymax-69-fire', brand: 'Ashaway', name: 'Zymax 69 Fire', gauge: '0.69mm', character: 'Durable with good repulsion', price: 23,
    colours: [{ name: 'Orange', hex: '#F47A20' }] },
  { id: 'ashaway-rally-21-fire', brand: 'Ashaway', name: 'Rally 21 Fire', gauge: '0.70mm', character: 'Durable, budget', price: 23,
    colours: [{ name: 'White', hex: '#F4F4F2' }] },

  // Babolat
  { id: 'babolat-ifeel-66', brand: 'Babolat', name: 'iFeel 66', gauge: '0.66mm', character: 'Comfortable all-rounder', price: 20,
    colours: [{ name: 'Black', hex: '#1A1A1A' }, { name: 'Blue', hex: '#2F6BD8' }] }
];
