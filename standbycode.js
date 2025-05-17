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

//Final Correct Add Items Code without Console.log
// app.post('/addItem', async (req, res) => {
//   try {
//     const { category, subcategory, grossWeight, materialsUsed } = req.body;

//     // Input validation
//     if (!category || typeof category !== 'string') {
//       return res
//         .status(400)
//         .json({ success: false, message: 'Valid category is required' });
//     }

//     if (!subcategory || typeof subcategory !== 'string') {
//       return res
//         .status(400)
//         .json({ success: false, message: 'Valid subcategory is required' });
//     }

//     if (isNaN(grossWeight) || grossWeight <= 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: 'Valid grossWeight is required' });
//     }

//     if (!Array.isArray(materialsUsed) || materialsUsed.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'materialsUsed must be a non-empty array',
//       });
//     }

//     // Generate product ID
//     const itemsSnapshot = await db.collection('ITEMS').get();
//     const maxId = itemsSnapshot.docs.reduce((max, doc) => {
//       const num = parseInt(doc.id.replace('APJ', ''), 10);
//       return num > max ? num : max;
//     }, 0);
//     const newID = `APJ${String(maxId + 1).padStart(3, '0')}`;

//     // Fetch PRICES
//     const priceSnapshot = await db.collection('PRICES').get();
//     const priceMap = priceSnapshot.docs.reduce((acc, doc) => {
//       acc[doc.id] = doc.data();
//       return acc;
//     }, {});

//     const pricing = {
//       base: 0,
//       FRQ: 0,
//       RQ: 0,
//     };

//     for (const materialGroup of materialsUsed) {
//       const docname = materialGroup.docname;
//       if (!docname || typeof docname !== 'string') {
//         console.warn('Skipping material group with invalid docname');
//         continue;
//       }

//       const priceGroup = priceMap[docname];
//       if (!priceGroup) {
//         console.warn(`Price group not found for docname: ${docname}`);
//         continue;
//       }

//       for (const [materialType, quantity] of Object.entries(materialGroup)) {
//         if (materialType === 'docname') continue;
//         if (isNaN(quantity)) {
//           console.warn(`Invalid quantity for ${materialType}`);
//           continue;
//         }

//         const priceArray = priceGroup[materialType];
//         if (!Array.isArray(priceArray) || priceArray.length !== 3) {
//           console.warn(
//             `Price array not found or invalid for ${materialType} in ${docname}`
//           );
//           continue;
//         }

//         // Base prices per tier
//         const basePrice = priceArray[0] * quantity;
//         const frqPrice = priceArray[1] * quantity;
//         const rqPrice = priceArray[2] * quantity;

//         pricing.base += basePrice;
//         pricing.FRQ += frqPrice;
//         pricing.RQ += rqPrice;

//         // Making charges
//         const makingArray = priceGroup.MAKING || priceGroup.MAKINGCHARGES;
//         let makingBase = 0,
//           makingFRQ = 0,
//           makingRQ = 0;

//         if (Array.isArray(makingArray) && makingArray.length === 3) {
//           makingBase = makingArray[0] * quantity;
//           makingFRQ = makingArray[1] * quantity;
//           makingRQ = makingArray[2] * quantity;

//           pricing.base += makingBase;
//           pricing.FRQ += makingFRQ;
//           pricing.RQ += makingRQ;
//         }

//         // Wastage
//         const wastageArray = priceGroup.WASTAGE;
//         if (Array.isArray(wastageArray) && wastageArray.length === 3) {
//           pricing.base += (basePrice + makingBase) * (wastageArray[0] / 100);
//           pricing.FRQ += (frqPrice + makingFRQ) * (wastageArray[1] / 100);
//           pricing.RQ += (rqPrice + makingRQ) * (wastageArray[2] / 100);
//         }
//       }
//     }

//     // Round totals
//     const totalPrice = Math.round(pricing.base * 100) / 100;
//     const franchisePrice = Math.round(pricing.FRQ * 100) / 100;
//     const retailPrice = Math.round(pricing.RQ * 100) / 100;

//     // Create new item
//     const newItem = {
//       category: category.toUpperCase(),
//       subcategory: subcategory.toUpperCase(),
//       grossWeight: parseFloat(grossWeight),
//       materialsUsed,
//       pricing: {
//         base: totalPrice,
//         franchise: franchisePrice,
//         retail: retailPrice,
//       },
//     };

//     await db.collection('ITEMS').doc(newID).set(newItem);

//     return res.status(201).json({
//       success: true,
//       message: 'Jewelry item successfully added',
//       data: {
//         productId: newID,
//         category: newItem.category,
//         subcategory: newItem.subcategory,
//         grossWeight: newItem.grossWeight,
//         pricing: newItem.pricing,
//         materialsCount: materialsUsed.length,
//       },
//     });
//   } catch (error) {
//     console.error('Error in /addItem:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message,
//     });
//   }
// });

// import React, { useEffect, useState } from 'react';

// export default function UpdatePrice() {
//   const [prices, setPrices] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetch('https://apjapi.vercel.app/getAllPrices')
//       .then((res) => res.json())
//       .then((data) => {
//         if (data.success) {
//           setPrices(data.PRICES);
//         }
//       })
//       .catch((err) => console.error('Error fetching prices:', err))
//       .finally(() => setLoading(false));
//   }, []);

//   const handleInputChange = (categoryIndex, itemKey, tierIndex, value) => {
//     const updatedPrices = [...prices];
//     const oldValue = updatedPrices[categoryIndex][itemKey][tierIndex];
//     updatedPrices[categoryIndex][itemKey][tierIndex] = value;
//     setPrices(updatedPrices);

//     console.log(`[Change Detected]`);
//     console.log(
//       `→ Category (docname): ${updatedPrices[categoryIndex].docname}`
//     );
//     console.log(`→ Item: ${itemKey}`);
//     console.log(`→ Tier: ${tierIndex + 1}`);
//     console.log(`→ Old Value: ${oldValue}`);
//     console.log(`→ New Value: ${value}`);
//     console.log('→ Full Updated Entry:', updatedPrices[categoryIndex][itemKey]);
//     console.log('→ Full Category Object:', updatedPrices[categoryIndex]);
//     console.log('Complete Object', updatedPrices);
//     console.log('---------------------------');
//   };

//   return (
//     <div className="updateprices-container">
//       <div className="headingup">
//         <h2 className="updateprices-heading">Update Prices</h2>
//         <div className="savechanges">Save Changes</div>
//       </div>
//       {loading ? (
//         <p className="updateprices-loading">Loading...</p>
//       ) : (
//         prices.map((category, categoryIndex) => (
//           <div key={category.docname} className="updateprices-category">
//             <div className="updateprices-category-header">
//               <h3>{category.docname}</h3>
//               <button className="updateprices-edit-button">Edit</button>
//             </div>
//             <div className="updateprices-items">
//               {Object.entries(category).map(([itemKey, values]) => {
//                 if (itemKey === 'docname') return null;
//                 return (
//                   <div key={itemKey} className="updateprices-item-row">
//                     <label className="updateprices-item-label">{itemKey}</label>
//                     <div className="updateprices-input-group">
//                       {values.map((value, tierIndex) => (
//                         <input
//                           key={tierIndex}
//                           type="number"
//                           value={value}
//                           onChange={(e) =>
//                             handleInputChange(
//                               categoryIndex,
//                               itemKey,
//                               tierIndex,
//                               e.target.value
//                             )
//                           }
//                           className="updateprices-input"
//                         />
//                       ))}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         ))
//       )}
//     </div>
//   );
// }

// const data = [
//   {
//     id: 'ORN001',
//     name: 'Royal Antique Necklace',
//     category: 'Necklace',
//     material: 'Gold',
//     purity: '22K',
//     grossWeight: 50,
//     netWeight: 48,
//     stoneWeight: 2,
//     stoneType: 'Ruby',
//     wastagePercent: 10,
//     makingChargesPerGram: 200,
//     pricePerGram: 5800,
//     totalMakingCharges: 9600,
//     totalPrice: 313600,
//     RQ: 300000,
//     FRQ: 280000,
//     image:
//       'https://images.naptol.com/usr/local/csp/staticContent/product_images/horizontal/750x750/Shubh-Muhurat-Jewellery-Collection-01.jpg',
//     description:
//       'Handcrafted antique-style necklace with ruby embellishments.',
//   },
//   {
//     id: 'ORN002',
//     name: 'Classic Wedding Ring',
//     category: 'Ring',
//     material: 'Gold',
//     purity: '18K',
//     grossWeight: 6,
//     netWeight: 6,
//     stoneWeight: 0,
//     stoneType: '',
//     wastagePercent: 8,
//     makingChargesPerGram: 180,
//     pricePerGram: 4800,
//     totalMakingCharges: 1080,
//     totalPrice: 32544,
//     RQ: 300000,
//     FRQ: 280000,
//     image: 'https://m.media-amazon.com/images/I/81en+7HxawS._AC_UY1100_.jpg',
//     description: 'Elegant gold wedding ring in polished 18K gold.',
//   },
//   {
//     id: 'ORN003',
//     name: 'Princess Diamond Earrings',
//     category: 'Earring',
//     material: 'Gold',
//     purity: '18K',
//     grossWeight: 10,
//     netWeight: 8,
//     stoneWeight: 2,
//     stoneType: 'Diamond',
//     wastagePercent: 8,
//     makingChargesPerGram: 250,
//     pricePerGram: 5000,
//     totalMakingCharges: 2000,
//     totalPrice: 50800,
//     RQ: 300000,
//     FRQ: 280000,
//     image: 'https://m.media-amazon.com/images/I/915xr2txe+S._AC_UY1100_.jpg',
//     description: '18K gold earrings studded with diamonds for a royal look.',
//   },
//   {
//     id: 'ORN004',
//     name: 'Modern Silver Cuff',
//     category: 'Bracelet',
//     material: 'Silver',
//     purity: '92.5',
//     grossWeight: 22,
//     netWeight: 22,
//     stoneWeight: 0,
//     stoneType: '',
//     wastagePercent: 5,
//     makingChargesPerGram: 60,
//     pricePerGram: 75,
//     totalMakingCharges: 1320,
//     totalPrice: 2970,
//     RQ: 300000,
//     FRQ: 280000,
//     image:
//       'https://images.meesho.com/images/products/109961574/dtfwn_512.webp',
//     description: 'Minimalist sterling silver cuff with high polish.',
//   },
//   {
//     id: 'ORN005',
//     name: 'Traditional Bridal Bangles',
//     category: 'Bangle',
//     material: 'Gold',
//     purity: '22K',
//     grossWeight: 40,
//     netWeight: 39,
//     stoneWeight: 1,
//     stoneType: 'CZ',
//     wastagePercent: 10,
//     makingChargesPerGram: 190,
//     pricePerGram: 5800,
//     totalMakingCharges: 7410,
//     totalPrice: 271110,
//     RQ: 300000,
//     FRQ: 280000,
//     image:
//       'https://5.imimg.com/data5/SELLER/Default/2023/9/342004062/LM/TL/PB/35175566/jewellery-png-2-500x500.jpg',
//     description: 'Bridal gold bangles with fine cubic zirconia details.',
//   },
//   {
//     id: 'ORN006',
//     name: 'Engraved Gold Pendant',
//     category: 'Pendant',
//     material: 'Gold',
//     purity: '22K',
//     grossWeight: 12,
//     netWeight: 12,
//     stoneWeight: 0,
//     stoneType: '',
//     wastagePercent: 6,
//     makingChargesPerGram: 170,
//     pricePerGram: 5800,
//     totalMakingCharges: 2040,
//     totalPrice: 77736,
//     RQ: 300000,
//     FRQ: 280000,
//     image: 'https://in.all.biz/img/in/catalog/324158.jpeg',
//     description: 'Customizable gold pendant with floral engraving.',
//   },
//   {
//     id: 'ORN007',
//     name: 'Elegant Anklet Pair',
//     category: 'Anklet',
//     material: 'Silver',
//     purity: '92.5',
//     grossWeight: 30,
//     netWeight: 30,
//     stoneWeight: 0,
//     stoneType: '',
//     wastagePercent: 5,
//     makingChargesPerGram: 55,
//     pricePerGram: 75,
//     totalMakingCharges: 1650,
//     totalPrice: 3900,
//     RQ: 300000,
//     FRQ: 280000,
//     image: 'https://m.media-amazon.com/images/I/714ITzZgFTL._AC_UY1100_.jpg',
//     description: 'Sterling silver anklets with traditional charm design.',
//   },
//   {
//     id: 'ORN008',
//     name: 'Kids Adjustable Kada',
//     category: 'Kada',
//     material: 'Gold',
//     purity: '22K',
//     grossWeight: 15,
//     netWeight: 14.5,
//     stoneWeight: 0.5,
//     stoneType: 'Emerald',
//     wastagePercent: 9,
//     makingChargesPerGram: 160,
//     pricePerGram: 5800,
//     totalMakingCharges: 2320,
//     totalPrice: 101790,
//     RQ: 300000,
//     FRQ: 280000,
//     image:
//       'https://sukkhi.com/cdn/shop/products/N73718_28i2_29_2000x.jpg?v=1551866942',
//     description: 'Adjustable gold kada for kids with emerald highlight.',
//   },
//   {
//     id: 'ORN009',
//     name: 'Bridal Gold Maang Tikka',
//     category: 'Maang Tikka',
//     material: 'Gold',
//     purity: '22K',
//     grossWeight: 18,
//     netWeight: 17.5,
//     stoneWeight: 0.5,
//     stoneType: 'Polki',
//     wastagePercent: 12,
//     makingChargesPerGram: 210,
//     pricePerGram: 5800,
//     totalMakingCharges: 3675,
//     totalPrice: 124290,
//     RQ: 300000,
//     FRQ: 280000,
//     image:
//       'https://i.pinimg.com/564x/06/fa/59/06fa59e35a6df52c532aab465a4483dd.jpg',
//     description: 'Heavily embellished bridal maang tikka with Polki stones.',
//   },
//   {
//     id: 'ORN010',
//     name: 'Gents Gold Chain',
//     category: 'Chain',
//     material: 'Gold',
//     purity: '22K',
//     grossWeight: 25,
//     netWeight: 25,
//     stoneWeight: 0,
//     stoneType: '',
//     wastagePercent: 7,
//     makingChargesPerGram: 180,
//     pricePerGram: 5800,
//     totalMakingCharges: 4500,
//     totalPrice: 159375,
//     RQ: 300000,
//     FRQ: 280000,
//     image:
//       'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtPWtIwSXil4ffkj9fMU8Ghum4bOhWEoBLJw&s',
//     description: 'Sturdy and elegant 22K gold chain for men.',
//   },
// ];
