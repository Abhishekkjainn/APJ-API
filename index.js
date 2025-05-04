const express = require('express');
const app = express();
const cors = require('cors');
const { db } = require('./firebase');
const crypto = require('crypto');

app.use(express.json());
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

// Helper function to get triple prices from a material entry
const getPriceTriple = (entry = {}) => {
  const single = entry.price;
  const p1 = entry.price1 ?? single ?? 0;
  const p2 = entry.price2 ?? single ?? 0;
  const p3 = entry.price3 ?? single ?? 0;
  return [p1, p2, p3];
};

// Add Item Endpoint
app.post('/addItem', async (req, res) => {
  const {
    productId,
    category,
    subcategory,
    imageUrl,
    grossWeight,
    makingCharges,
    wastagePercent,
    materialsUsed, // Array: [{ materialName, quantity }]
  } = req.body;

  if (
    !productId ||
    !category ||
    !subcategory ||
    !imageUrl ||
    !grossWeight ||
    makingCharges === undefined ||
    wastagePercent === undefined ||
    !Array.isArray(materialsUsed) ||
    materialsUsed.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields or invalid format',
    });
  }

  try {
    const pricesSnapshot = await db.collection('PRICES').doc(category).get();
    if (!pricesSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: `No pricing data found for category: ${category}`,
      });
    }

    const priceData = pricesSnapshot.data();
    let totalPrice1 = 0,
      totalPrice2 = 0,
      totalPrice3 = 0;

    for (const item of materialsUsed) {
      const [p1, p2, p3] = getPriceTriple(priceData[item.materialName]);
      totalPrice1 += item.quantity * p1;
      totalPrice2 += item.quantity * p2;
      totalPrice3 += item.quantity * p3;
    }

    const [base1, base2, base3] = getPriceTriple(priceData['base']);

    const wastageAmount1 = grossWeight * (wastagePercent / 100) * base1;
    const wastageAmount2 = grossWeight * (wastagePercent / 100) * base2;
    const wastageAmount3 = grossWeight * (wastagePercent / 100) * base3;

    let making1 = 0,
      making2 = 0,
      making3 = 0;
    if (typeof makingCharges === 'number') {
      making1 = making2 = making3 = makingCharges;
    } else if (typeof makingCharges === 'object') {
      making1 = makingCharges.quote ?? 0;
      making2 = makingCharges.RQ ?? 0;
      making3 = makingCharges.FRQ ?? 0;
    }

    const quote = totalPrice1 + making1 + wastageAmount1;
    const RQ = totalPrice2 + making2 + wastageAmount2;
    const FRQ = totalPrice3 + making3 + wastageAmount3;

    const itemData = {
      productId,
      category,
      subcategory,
      imageUrl,
      grossWeight,
      makingCharges,
      wastagePercent,
      materialsUsed,
      prices: {
        quote: parseFloat(quote.toFixed(2)),
        RQ: parseFloat(RQ.toFixed(2)),
        FRQ: parseFloat(FRQ.toFixed(2)),
      },
      timestamp: new Date(),
    };

    await db.collection('ITEMS').doc(productId).set(itemData);

    return res.status(201).json({
      success: true,
      message: 'Item added successfully',
      data: itemData,
    });
  } catch (error) {
    console.error('Error adding item:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
});

// Update Prices Endpoint
app.post('/updatePrices', async (req, res) => {
  const { updates } = req.body;

  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Invalid or missing "updates" object in request body',
    });
  }

  try {
    const updatedItemsByCategory = {};

    for (const [category, categoryPrices] of Object.entries(updates)) {
      await db.collection('PRICES').doc(category).set(categoryPrices);

      const itemsSnapshot = await db
        .collection('ITEMS')
        .where('category', '==', category)
        .get();
      const updatedItems = [];

      for (const doc of itemsSnapshot.docs) {
        const item = doc.data();
        const { materialsUsed, grossWeight, makingCharges, wastagePercent } =
          item;

        let total1 = 0,
          total2 = 0,
          total3 = 0;
        for (const mat of materialsUsed) {
          const [p1, p2, p3] = getPriceTriple(categoryPrices[mat.materialName]);
          total1 += mat.quantity * p1;
          total2 += mat.quantity * p2;
          total3 += mat.quantity * p3;
        }

        const [base1, base2, base3] = getPriceTriple(categoryPrices['base']);

        const wastage1 = ((grossWeight * wastagePercent) / 100) * base1;
        const wastage2 = ((grossWeight * wastagePercent) / 100) * base2;
        const wastage3 = ((grossWeight * wastagePercent) / 100) * base3;

        let making1 = 0,
          making2 = 0,
          making3 = 0;
        if (typeof makingCharges === 'number') {
          making1 = making2 = making3 = makingCharges;
        } else if (typeof makingCharges === 'object') {
          making1 = makingCharges.quote ?? 0;
          making2 = makingCharges.RQ ?? 0;
          making3 = makingCharges.FRQ ?? 0;
        }

        const updatedItemData = {
          ...item,
          prices: {
            quote: parseFloat((total1 + making1 + wastage1).toFixed(2)),
            RQ: parseFloat((total2 + making2 + wastage2).toFixed(2)),
            FRQ: parseFloat((total3 + making3 + wastage3).toFixed(2)),
          },
        };

        await db
          .collection('ITEMS')
          .doc(item.productId)
          .update(updatedItemData);
        updatedItems.push(item.productId);
      }

      updatedItemsByCategory[category] = updatedItems;
    }

    return res.status(200).json({
      success: true,
      message: 'Prices updated and items recalculated successfully',
      updatedItemsByCategory,
    });
  } catch (error) {
    console.error('Error in updatePrices:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating prices and items',
    });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
