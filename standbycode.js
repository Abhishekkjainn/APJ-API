// app.get(
//   '/authenticate/username=:username/password=:password',
//   async (req, res) => {
//     const { username, password } = req.params;

//     try {
//       const userDocRef = db.collection('USERS').doc(username);
//       const userDoc = await userDocRef.get();

//       if (!userDoc.exists) {
//         return res
//           .status(404)
//           .json({ success: false, message: 'User not found' });
//       }

//       const userData = userDoc.data();

//       // OPTIONAL: Secure password comparison (here it's plain text – you should hash in production)
//       if (userData.PASSWORD !== password) {
//         return res
//           .status(401)
//           .json({ success: false, message: 'Incorrect password' });
//       }

//       return res.status(200).json({
//         success: true,
//         message: 'Authentication successful',
//         data: {
//           username: userData.USERNAME,
//           isAdmin: userData.ADMIN,
//         },
//       });
//     } catch (error) {
//       console.error('Error authenticating user:', error);
//       return res
//         .status(500)
//         .json({ success: false, message: 'Internal server error' });
//     }
//   }
// );

// // Add A User
// app.get(
//   '/addUser/username=:username/password=:password/admin=:admin',
//   async (req, res) => {
//     const { username, password, admin } = req.params;

//     if (!username || !password || typeof admin === 'undefined') {
//       return res
//         .status(400)
//         .json({ success: false, message: 'Missing required fields' });
//     }

//     const isAdmin = admin === 'true';

//     try {
//       const userRef = db.collection('USERS').doc(username);
//       const userDoc = await userRef.get();

//       if (userDoc.exists) {
//         return res
//           .status(409)
//           .json({ success: false, message: 'User already exists' });
//       }

//       await userRef.set({
//         USERNAME: username,
//         PASSWORD: password,
//         ADMIN: isAdmin,
//       });

//       return res
//         .status(201)
//         .json({ success: true, message: 'User added successfully' });
//     } catch (error) {
//       console.error('Error adding user:', error);
//       return res
//         .status(500)
//         .json({ success: false, message: 'Internal server error' });
//     }
//   }
// );

// //Update User Access
// app.get(
//   '/editAdminAccess/username=:username/admin=:admin',
//   async (req, res) => {
//     const { username, admin } = req.params;

//     if (!username || typeof admin === 'undefined') {
//       return res
//         .status(400)
//         .json({ success: false, message: 'Missing required fields' });
//     }

//     const isAdmin = admin === 'true';

//     try {
//       const userRef = db.collection('USERS').doc(username);
//       const userDoc = await userRef.get();

//       if (!userDoc.exists) {
//         return res
//           .status(404)
//           .json({ success: false, message: 'User not found' });
//       }

//       await userRef.update({ ADMIN: isAdmin });

//       return res
//         .status(200)
//         .json({ success: true, message: 'Admin access updated' });
//     } catch (error) {
//       console.error('Error updating admin access:', error);
//       return res
//         .status(500)
//         .json({ success: false, message: 'Internal server error' });
//     }
//   }
// );

// //Delete a user
// app.get('/deleteUser/username=:username', async (req, res) => {
//   const { username } = req.params;

//   if (!username) {
//     return res
//       .status(400)
//       .json({ success: false, message: 'Username is required' });
//   }

//   try {
//     const userRef = db.collection('USERS').doc(username);
//     const userDoc = await userRef.get();

//     if (!userDoc.exists) {
//       return res
//         .status(404)
//         .json({ success: false, message: 'User not found' });
//     }

//     await userRef.delete();

//     return res
//       .status(200)
//       .json({ success: true, message: 'User deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting user:', error);
//     return res
//       .status(500)
//       .json({ success: false, message: 'Internal server error' });
//   }
// });

// //GET All Users
// app.get('/getAllUsers', async (req, res) => {
//   try {
//     const snapshot = await db.collection('USERS').get();

//     const users = snapshot.docs.map((doc) => ({
//       docname: doc.id,
//       ...doc.data(),
//     }));

//     return res.status(200).json({ success: true, users });
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     return res
//       .status(500)
//       .json({ success: false, message: 'Internal server error' });
//   }
// });

// app.post('/updatePrices', async (req, res) => {
//     const { updates } = req.body;

//     if (!updates || typeof updates !== 'object') {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid or missing "updates" object in request body',
//       });
//     }

//     try {
//       const updatedItemsByCategory = {};

//       for (const [category, categoryPrices] of Object.entries(updates)) {
//         // 1. Update PRICES collection
//         await db.collection('PRICES').doc(category).set(categoryPrices);

//         // 2. Get all ITEMS matching this category
//         const itemsSnapshot = await db
//           .collection('ITEMS')
//           .where('category', '==', category)
//           .get();

//         const updatedItems = [];

//         for (const doc of itemsSnapshot.docs) {
//           const item = doc.data();
//           const { materialsUsed, grossWeight, makingCharges, wastagePercent } =
//             item;

//           let total1 = 0;
//           let total2 = 0;
//           let total3 = 0;

//           for (const mat of materialsUsed) {
//             const matName = mat.materialName;
//             const matQty = mat.quantity;

//             const priceEntry = categoryPrices[matName] || {};
//             const p1 = priceEntry.price1 || 0;
//             const p2 = priceEntry.price2 || 0;
//             const p3 = priceEntry.price3 || 0;

//             total1 += matQty * p1;
//             total2 += matQty * p2;
//             total3 += matQty * p3;
//           }

//           // Base price for wastage (optional, fallback to 0)
//           const base = categoryPrices['base'] || {};
//           const base1 = base.price1 || 0;
//           const base2 = base.price2 || 0;
//           const base3 = base.price3 || 0;

//           // Making charges per quote (can be single value or object)
//           let making1 = 0,
//             making2 = 0,
//             making3 = 0;
//           if (typeof makingCharges === 'number') {
//             making1 = making2 = making3 = makingCharges;
//           } else if (typeof makingCharges === 'object') {
//             making1 = makingCharges.quote || 0;
//             making2 = makingCharges.RQ || 0;
//             making3 = makingCharges.FRQ || 0;
//           }

//           // Wastage calculations
//           const wastage1 = ((grossWeight * wastagePercent) / 100) * base1;
//           const wastage2 = ((grossWeight * wastagePercent) / 100) * base2;
//           const wastage3 = ((grossWeight * wastagePercent) / 100) * base3;

//           // Final prices
//           const quote = total1 + making1 + wastage1;
//           const RQ = total2 + making2 + wastage2;
//           const FRQ = total3 + making3 + wastage3;

//           const updatedItemData = {
//             ...item,
//             prices: {
//               quote: parseFloat(quote.toFixed(2)),
//               RQ: parseFloat(RQ.toFixed(2)),
//               FRQ: parseFloat(FRQ.toFixed(2)),
//             },
//           };

//           await db
//             .collection('ITEMS')
//             .doc(item.productId)
//             .update(updatedItemData);
//           updatedItems.push(item.productId);
//         }

//         updatedItemsByCategory[category] = updatedItems;
//       }

//       return res.status(200).json({
//         success: true,
//         message: 'Prices updated and items recalculated successfully',
//         updatedItemsByCategory,
//       });
//     } catch (error) {
//       console.error('Error in updatePrices:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Internal server error while updating prices and items',
//       });
//     }
//   });

// app.post('/updatePrices', async (req, res) => {
//   try {
//     const updatedPrices = req.body.PRICES;

//     // Basic validation
//     if (!Array.isArray(updatedPrices) || updatedPrices.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid or empty PRICES array in request body',
//       });
//     }

//     const batch = db.batch();

//     for (const priceDoc of updatedPrices) {
//       const { docname, ...fieldsToUpdate } = priceDoc;

//       if (!docname || typeof docname !== 'string') {
//         return res.status(400).json({
//           success: false,
//           message: 'Each price document must include a valid "docname".',
//         });
//       }

//       const docRef = db.collection('PRICES').doc(docname);

//       // Apply partial update (merge: true)
//       batch.set(docRef, fieldsToUpdate, { merge: true });
//     }

//     await batch.commit();

//     return res.status(200).json({
//       success: true,
//       message: `${updatedPrices.length} PRICES documents updated partially`,
//     });
//   } catch (error) {
//     console.error('Error during partial update of PRICES:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error while partially updating PRICES',
//     });
//   }
// });

// {
//   "success": true,
//   "message": "5 PRICES retrieved",
//   "PRICES": [
//     {
//       "docname": "DIAMONDS",
//       "D1-VVS": [15000, 15000, 15000],
//       "D2-VS": [14000, 14000, 14000],
//       "D3-SI": [12000, 12000, 12000],
//       "MAKING": [1000, 800, 600]
//     },
//     {
//       "docname": "GOLD",
//       "WASTAGE": [18, 15, 12],
//       "MAKINGCHARGES": [500, 400, 300],
//       "16k": [4500, 4500, 4500],
//       "22k": [6500, 6500, 6500],
//       "18k": [5000, 5000, 5000]
//     },
//     {
//       "docname": "PEARLS",
//       "CORAL": [150, 150, 150]
//     },
//     {
//       "docname": "POLKI",
//       "FLATPOLKI": [15000, 14000, 13000],
//       "FLATPOLKIBIG": [20000, 19000, 18000],
//       "MAKING": [1500, 1400, 1300]
//     },
//     {
//       "docname": "STONES",
//       "Pe/mq (+10)": [120, 120, 120]
//     }
//   ]
// }

// app.post('/addItem', async (req, res) => {
//   try {
//     const { category, subcategory, grossWeight, materialsUsed } = req.body;

//     if (
//       !category ||
//       !subcategory ||
//       !grossWeight ||
//       !Array.isArray(materialsUsed)
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: 'Missing or invalid fields.' });
//     }

//     // Generate unique product ID
//     const snapshot = await db.collection('ITEMS').get();
//     const existingIDs = snapshot.docs.map((doc) => doc.id);
//     const nextIDNumber =
//       existingIDs
//         .map((id) => parseInt(id.replace('APJ', ''), 10))
//         .filter((n) => !isNaN(n))
//         .sort((a, b) => b - a)[0] || 0;
//     const newID = `APJ${String(nextIDNumber + 1).padStart(3, '0')}`;

//     // Fetch latest prices
//     const priceSnapshot = await db.collection('PRICES').get();
//     const priceMap = {};
//     priceSnapshot.docs.forEach((doc) => {
//       priceMap[doc.id] = doc.data();
//     });

//     // Calculate total price for 3 tiers
//     let totalPrice = 0;
//     let FRQ = 0;
//     let RQ = 0;

//     for (const materialGroup of materialsUsed) {
//       const { docname, ...entries } = materialGroup;
//       const priceGroup = priceMap[docname];
//       if (!priceGroup) continue;

//       for (const [key, qty] of Object.entries(entries)) {
//         const priceArr = priceGroup[key];
//         if (!Array.isArray(priceArr) || priceArr.length !== 3) continue;

//         // Base price calculation (qty * price for the material)
//         totalPrice += qty * priceArr[0];
//         FRQ += qty * priceArr[1];
//         RQ += qty * priceArr[2];

//         // Add making charges if available
//         if (priceGroup['MAKING'] && Array.isArray(priceGroup['MAKING'])) {
//           // Three making charge values for each price tier
//           const makingChargeBase = priceGroup['MAKING'][0]; // Base price making charge
//           const makingChargeFRQ = priceGroup['MAKING'][1]; // FRQ price making charge
//           const makingChargeRQ = priceGroup['MAKING'][2]; // RQ price making charge

//           totalPrice += qty * makingChargeBase;
//           FRQ += qty * makingChargeFRQ;
//           RQ += qty * makingChargeRQ;
//         }

//         // Add wastage if available
//         if (priceGroup['WASTAGE'] && Array.isArray(priceGroup['WASTAGE'])) {
//           // Three wastage percentage values for each price tier
//           const wastageBase = priceGroup['WASTAGE'][0]; // Base price wastage percentage
//           const wastageFRQ = priceGroup['WASTAGE'][1]; // FRQ price wastage percentage
//           const wastageRQ = priceGroup['WASTAGE'][2]; // RQ price wastage percentage

//           // Calculate wastage quantity based on percentage
//           const wastageQtyBase = (qty * wastageBase) / 100;
//           const wastageQtyFRQ = (qty * wastageFRQ) / 100;
//           const wastageQtyRQ = (qty * wastageRQ) / 100;

//           totalPrice += wastageQtyBase * priceArr[0];
//           FRQ += wastageQtyFRQ * priceArr[1];
//           RQ += wastageQtyRQ * priceArr[2];
//         }
//       }
//     }

//     const newItem = {
//       category,
//       subcategory,
//       grossWeight,
//       materialsUsed,
//       totalPrice,
//       FRQ,
//       RQ,
//       createdAt: new Date().toISOString(),
//     };

//     await db.collection('ITEMS').doc(newID).set(newItem);

//     return res.status(201).json({
//       success: true,
//       message: 'Item added successfully.',
//       productId: newID,
//       totalPrice,
//       FRQ,
//       RQ,
//     });
//   } catch (error) {
//     console.error('Error adding item:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error while adding item.',
//     });
//   }
// });

// app.post('/addItem', async (req, res) => {
//   try {
//     const { category, subcategory, grossWeight, materialsUsed } = req.body;

//     // Validation
//     if (
//       !category ||
//       !subcategory ||
//       !grossWeight ||
//       !Array.isArray(materialsUsed)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           'Missing required fields: category, subcategory, grossWeight, or materialsUsed',
//       });
//     }

//     // Generate ID using counter document
//     const counterRef = db.collection('COUNTERS').doc('items');
//     const { counter } = await db.runTransaction(async (transaction) => {
//       const doc = await transaction.get(counterRef);
//       const currentCount = doc.exists ? doc.data().count || 0 : 0;
//       transaction.set(counterRef, { count: currentCount + 1 }, { merge: true });
//       return { counter: currentCount + 1 };
//     });
//     const newID = `APJ${String(counter).padStart(3, '0')}`;

//     // Fetch prices
//     const priceSnapshot = await db.collection('PRICES').get();
//     const priceMap = priceSnapshot.docs.reduce((acc, doc) => {
//       acc[doc.id] = doc.data();
//       return acc;
//     }, {});

//     // Price calculation
//     let [totalPrice, FRQ, RQ] = [0, 0, 0];

//     for (const materialGroup of materialsUsed) {
//       const { docname, ...entries } = materialGroup;
//       const priceGroup = priceMap[docname] || {};

//       // Get making charge key (handles both MAKING and MAKINGCHARGES)
//       const makingKey = Object.keys(priceGroup).find(
//         (k) => k === 'MAKING' || k === 'MAKINGCHARGES'
//       );
//       const makingCharges = makingKey ? priceGroup[makingKey] : null;

//       // Validate making charges format
//       if (
//         makingCharges &&
//         (!Array.isArray(makingCharges) || makingCharges.length !== 3)
//       ) {
//         console.warn(`Invalid making charges format for ${docname}`);
//         makingCharges = null;
//       }

//       // Process material entries
//       for (const [materialKey, qty] of Object.entries(entries)) {
//         const prices = priceGroup[materialKey];
//         if (!Array.isArray(prices) || prices.length !== 3) continue;

//         // Base material pricing
//         totalPrice += qty * prices[0];
//         FRQ += qty * prices[1];
//         RQ += qty * prices[2];

//         // Apply making charges if available
//         if (makingCharges) {
//           totalPrice += qty * makingCharges[0];
//           FRQ += qty * makingCharges[1];
//           RQ += qty * makingCharges[2];
//         }

//         // Apply wastage if available
//         if (priceGroup.WASTAGE) {
//           const [wastageBase, wastageFRQ, wastageRQ] = priceGroup.WASTAGE;

//           totalPrice += ((qty * wastageBase) / 100) * prices[0];
//           FRQ += ((qty * wastageFRQ) / 100) * prices[1];
//           RQ += ((qty * wastageRQ) / 100) * prices[2];
//         }
//       }
//     }

//     // Create new item
//     const newItem = {
//       category,
//       subcategory,
//       grossWeight: parseFloat(grossWeight),
//       materialsUsed,
//       pricing: {
//         base: Math.round(totalPrice),
//         FRQ: Math.round(FRQ),
//         RQ: Math.round(RQ),
//       },
//       createdAt: new Date().toISOString(),
//     };

//     // Save to Firestore
//     await db.collection('ITEMS').doc(newID).set(newItem);

//     return res.status(201).json({
//       success: true,
//       message: 'Item added successfully',
//       productId: newID,
//       pricing: newItem.pricing,
//     });
//   } catch (error) {
//     console.error('Error adding item:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message,
//     });
//   }
// });
