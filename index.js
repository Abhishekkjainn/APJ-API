const express = require('express');
const app = express();
const cors = require('cors');
const { db } = require('./firebase');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(cors({ origin: '*' }));

app.get('/', (req, res) => {
  res.send('Amarsons Pearls and Jewels');
});

// AUTHENTICATE
app.get(
  '/authenticate/username=:username/password=:password',
  async (req, res) => {
    const { username, password } = req.params;

    try {
      const userDocRef = db.collection('USERS').doc(username);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: `User '${username}' not found`,
        });
      }

      const userData = userDoc.data();

      if (userData.PASSWORD !== password) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: {
          username: userData.USERNAME,
          isAdmin: userData.ADMIN,
        },
      });
    } catch (error) {
      console.error(`Authentication error for user '${username}':`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication',
      });
    }
  }
);

// ADD USER
app.get(
  '/addUser/username=:username/password=:password/admin=:admin',
  async (req, res) => {
    const { username, password, admin } = req.params;

    if (!username || !password || typeof admin === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: username, password, or admin',
      });
    }

    const isAdmin = admin === 'true';

    try {
      const userRef = db.collection('USERS').doc(username);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        return res.status(409).json({
          success: false,
          message: `User '${username}' already exists`,
        });
      }

      await userRef.set({
        USERNAME: username,
        PASSWORD: password,
        ADMIN: isAdmin,
      });

      return res.status(201).json({
        success: true,
        message: `User '${username}' added successfully`,
      });
    } catch (error) {
      console.error(`Error adding user '${username}':`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while adding user',
      });
    }
  }
);

// EDIT ADMIN ACCESS
app.get(
  '/editAdminAccess/username=:username/admin=:admin',
  async (req, res) => {
    const { username, admin } = req.params;

    if (!username || typeof admin === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: username or admin',
      });
    }

    const isAdmin = admin === 'true';

    try {
      const userRef = db.collection('USERS').doc(username);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: `User '${username}' not found`,
        });
      }

      await userRef.update({ ADMIN: isAdmin });

      return res.status(200).json({
        success: true,
        message: `Admin access for '${username}' updated to ${isAdmin}`,
      });
    } catch (error) {
      console.error(`Error updating admin access for '${username}':`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while updating admin access',
      });
    }
  }
);

// DELETE USER
app.get('/deleteUser/username=:username', async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({
      success: false,
      message: 'Username is required to delete a user',
    });
  }

  try {
    const userRef = db.collection('USERS').doc(username);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: `User '${username}' not found`,
      });
    }

    await userRef.delete();

    return res.status(200).json({
      success: true,
      message: `User '${username}' deleted successfully`,
    });
  } catch (error) {
    console.error(`Error deleting user '${username}':`, error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting user',
    });
  }
});

// GET ALL USERS
app.get('/getAllUsers', async (req, res) => {
  try {
    const snapshot = await db.collection('USERS').get();

    const users = snapshot.docs.map((doc) => ({
      docname: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      message: `${users.length} users retrieved`,
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users',
    });
  }
});

app.get('/getAllPrices', async (req, res) => {
  try {
    const snapshot = await db.collection('PRICES').get();

    const PRICES = snapshot.docs.map((doc) => ({
      docname: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      message: `${PRICES.length} PRICES retrieved`,
      PRICES,
    });
  } catch (error) {
    console.error('Error fetching PRICES:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users',
    });
  }
});

// app.get('/getAllItems', async (req, res) => {
//   try {
//     const snapshot = await db.collection('ITEMS').get();

//     const ITEMS = snapshot.docs.map((doc) => ({
//       category: doc.id,
//       ...doc.data(),
//     }));

//     return res.status(200).json({
//       success: true,
//       message: `${ITEMS.length} ITEMS retrieved`,
//       ITEMS,
//     });
//   } catch (error) {
//     console.error('Error fetching ITEMS:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error while fetching users',
//     });
//   }
// });

app.get('/getAllItems', async (req, res) => {
  try {
    const [itemsSnapshot, priceSnapshot] = await Promise.all([
      db.collection('ITEMS').get(),
      db.collection('PRICES').get(),
    ]);

    const priceMap = priceSnapshot.docs.reduce((acc, doc) => {
      acc[doc.id] = doc.data();
      return acc;
    }, {});

    const updatedItems = [];

    for (const doc of itemsSnapshot.docs) {
      const itemData = doc.data();
      const { materialsUsed } = itemData;
      const pricing = { base: 0, FRQ: 0, RQ: 0 };

      console.log(`\n--- Checking Item ${doc.id} ---\n`);

      for (const materialGroup of materialsUsed) {
        const docname = materialGroup.docname;
        if (!docname || typeof docname !== 'string') continue;

        const priceGroup = priceMap[docname];
        if (!priceGroup) {
          console.warn(`⚠ No price group found for ${docname}`);
          continue;
        }

        console.log(`▶ Material Group: ${docname}`);

        for (const [materialType, quantity] of Object.entries(materialGroup)) {
          if (materialType === 'docname' || isNaN(quantity)) continue;

          const priceArray = priceGroup[materialType];
          if (!Array.isArray(priceArray) || priceArray.length !== 3) {
            console.warn(
              `⚠ Invalid price array for ${materialType} in ${docname}`
            );
            continue;
          }

          const basePrice = priceArray[0] * quantity;
          const frqPrice = priceArray[1] * quantity;
          const rqPrice = priceArray[2] * quantity;

          pricing.base += basePrice;
          pricing.FRQ += frqPrice;
          pricing.RQ += rqPrice;

          const makingArray = priceGroup.MAKING || priceGroup.MAKINGCHARGES;
          let makingBase = 0,
            makingFRQ = 0,
            makingRQ = 0;

          if (Array.isArray(makingArray) && makingArray.length === 3) {
            makingBase = makingArray[0] * quantity;
            makingFRQ = makingArray[1] * quantity;
            makingRQ = makingArray[2] * quantity;

            pricing.base += makingBase;
            pricing.FRQ += makingFRQ;
            pricing.RQ += makingRQ;
          }

          const wastageArray = priceGroup.WASTAGE;
          if (Array.isArray(wastageArray) && wastageArray.length === 3) {
            pricing.base += (basePrice + makingBase) * (wastageArray[0] / 100);
            pricing.FRQ += (frqPrice + makingFRQ) * (wastageArray[1] / 100);
            pricing.RQ += (rqPrice + makingRQ) * (wastageArray[2] / 100);
          }
        }
      }

      const recalculated = {
        base: Math.round(pricing.base * 100) / 100,
        franchise: Math.round(pricing.FRQ * 100) / 100,
        retail: Math.round(pricing.RQ * 100) / 100,
      };

      const original = itemData.pricing || {};
      const mismatch =
        original.base !== recalculated.base ||
        original.franchise !== recalculated.franchise ||
        original.retail !== recalculated.retail;

      if (mismatch) {
        console.log(`🔁 MISMATCH found. Updating ${doc.id}`);
        await db
          .collection('ITEMS')
          .doc(doc.id)
          .update({ pricing: recalculated });
      } else {
        console.log(`✅ Prices match for ${doc.id}`);
      }

      updatedItems.push({
        id: doc.id,
        category: itemData.category,
        subcategory: itemData.subcategory,
        pricing: recalculated,
        wasUpdated: mismatch,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Checked ${updatedItems.length} items. Updated mismatches automatically.`,
      items: updatedItems,
    });
  } catch (error) {
    console.error('Error verifying PRICES:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during verification',
      error: error.message,
    });
  }
});

app.post('/updatePrices', async (req, res) => {
  try {
    const updatedPrices = req.body.PRICES;

    if (!Array.isArray(updatedPrices) || updatedPrices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or empty PRICES array in request body',
      });
    }

    const batch = db.batch();

    updatedPrices.forEach((priceDoc) => {
      const { docname, ...fields } = priceDoc;
      if (!docname) return;

      const docRef = db.collection('PRICES').doc(docname);
      batch.set(docRef, fields); // overwrite the document completely
    });

    await batch.commit();

    return res.status(200).json({
      success: true,
      message: `${updatedPrices.length} PRICES updated successfully`,
    });
  } catch (error) {
    console.error('Error updating PRICES:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating PRICES',
    });
  }
});

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

app.post('/addItem', async (req, res) => {
  try {
    const { category, subcategory, grossWeight, materialsUsed } = req.body;

    // Input validation
    if (!category || typeof category !== 'string') {
      return res
        .status(400)
        .json({ success: false, message: 'Valid category is required' });
    }

    if (!subcategory || typeof subcategory !== 'string') {
      return res
        .status(400)
        .json({ success: false, message: 'Valid subcategory is required' });
    }

    if (isNaN(grossWeight) || grossWeight <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Valid grossWeight is required' });
    }

    if (!Array.isArray(materialsUsed) || materialsUsed.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'materialsUsed must be a non-empty array',
      });
    }

    const itemsSnapshot = await db.collection('ITEMS').get();
    const maxId = itemsSnapshot.docs.reduce((max, doc) => {
      const num = parseInt(doc.id.replace('APJ', ''), 10);
      return num > max ? num : max;
    }, 0);
    const newID = `APJ${String(maxId + 1).padStart(3, '0')}`;

    const priceSnapshot = await db.collection('PRICES').get();
    const priceMap = priceSnapshot.docs.reduce((acc, doc) => {
      acc[doc.id] = doc.data();
      return acc;
    }, {});

    const pricing = {
      base: 0,
      FRQ: 0,
      RQ: 0,
    };

    console.log(`\n--- Starting Price Calculation for Item ${newID} ---\n`);

    for (const materialGroup of materialsUsed) {
      const docname = materialGroup.docname;
      if (!docname || typeof docname !== 'string') {
        console.warn('Skipping material group with invalid docname');
        continue;
      }

      const priceGroup = priceMap[docname];
      if (!priceGroup) {
        console.warn(`Price group not found for docname: ${docname}`);
        continue;
      }

      console.log(`\n▶ Material Group: ${docname}`);

      for (const [materialType, quantity] of Object.entries(materialGroup)) {
        if (materialType === 'docname') continue;
        if (isNaN(quantity)) {
          console.warn(`Invalid quantity for ${materialType}`);
          continue;
        }

        const priceArray = priceGroup[materialType];
        if (!Array.isArray(priceArray) || priceArray.length !== 3) {
          console.warn(
            `Price array not found or invalid for ${materialType} in ${docname}`
          );
          continue;
        }

        const basePrice = priceArray[0] * quantity;
        const frqPrice = priceArray[1] * quantity;
        const rqPrice = priceArray[2] * quantity;

        console.log(`  ➤ Material: ${materialType}`);
        console.log(`    Quantity: ${quantity}`);
        console.log(
          `    Prices: Base=${priceArray[0]}, FRQ=${priceArray[1]}, RQ=${priceArray[2]}`
        );
        console.log(`    → Base Price: ${basePrice}`);
        console.log(`    → FRQ Price:  ${frqPrice}`);
        console.log(`    → RQ Price:   ${rqPrice}`);

        pricing.base += basePrice;
        pricing.FRQ += frqPrice;
        pricing.RQ += rqPrice;

        // Making Charges
        const makingArray = priceGroup.MAKING || priceGroup.MAKINGCHARGES;
        let makingBase = 0,
          makingFRQ = 0,
          makingRQ = 0;

        if (Array.isArray(makingArray) && makingArray.length === 3) {
          makingBase = makingArray[0] * quantity;
          makingFRQ = makingArray[1] * quantity;
          makingRQ = makingArray[2] * quantity;

          console.log(
            `    Making Charges per unit: Base=${makingArray[0]}, FRQ=${makingArray[1]}, RQ=${makingArray[2]}`
          );
          console.log(
            `    → Making: Base=${makingBase}, FRQ=${makingFRQ}, RQ=${makingRQ}`
          );

          pricing.base += makingBase;
          pricing.FRQ += makingFRQ;
          pricing.RQ += makingRQ;
        }

        // Wastage
        const wastageArray = priceGroup.WASTAGE;
        if (Array.isArray(wastageArray) && wastageArray.length === 3) {
          const wasteBase = (basePrice + makingBase) * (wastageArray[0] / 100);
          const wasteFRQ = (frqPrice + makingFRQ) * (wastageArray[1] / 100);
          const wasteRQ = (rqPrice + makingRQ) * (wastageArray[2] / 100);

          console.log(
            `    Wastage %: Base=${wastageArray[0]}%, FRQ=${wastageArray[1]}%, RQ=${wastageArray[2]}%`
          );
          console.log(
            `    → Wastage: Base=${wasteBase.toFixed(
              2
            )}, FRQ=${wasteFRQ.toFixed(2)}, RQ=${wasteRQ.toFixed(2)}`
          );

          pricing.base += wasteBase;
          pricing.FRQ += wasteFRQ;
          pricing.RQ += wasteRQ;
        }
      }
    }

    // Final Total Prices
    const totalPrice = Math.round(pricing.base * 100) / 100;
    const franchisePrice = Math.round(pricing.FRQ * 100) / 100;
    const retailPrice = Math.round(pricing.RQ * 100) / 100;

    console.log(`\n--- Final Price Summary ---`);
    console.log(`Total Base Price: ₹${totalPrice}`);
    console.log(`Franchise Price:  ₹${franchisePrice}`);
    console.log(`Retail Price:     ₹${retailPrice}`);
    console.log(`---------------------------\n`);

    const newItem = {
      category: category.toUpperCase(),
      subcategory: subcategory.toUpperCase(),
      grossWeight: parseFloat(grossWeight),
      materialsUsed,
      pricing: {
        base: totalPrice,
        franchise: franchisePrice,
        retail: retailPrice,
      },
    };

    await db.collection('ITEMS').doc(newID).set(newItem);

    return res.status(201).json({
      success: true,
      message: 'Jewelry item successfully added',
      data: {
        productId: newID,
        category: newItem.category,
        subcategory: newItem.subcategory,
        grossWeight: newItem.grossWeight,
        pricing: newItem.pricing,
        materialsCount: materialsUsed.length,
      },
    });
  } catch (error) {
    console.error('Error in /addItem:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

app.get('/deleteItem/productId=:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid productId is required',
      });
    }

    const itemRef = db.collection('ITEMS').doc(productId);
    const doc = await itemRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: `Item with productId ${productId} does not exist`,
      });
    }

    await itemRef.delete();

    return res.status(200).json({
      success: true,
      message: `Item ${productId} successfully deleted`,
    });
  } catch (error) {
    console.error('Error in /deleteItem:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
