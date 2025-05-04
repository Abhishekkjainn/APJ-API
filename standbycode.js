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
