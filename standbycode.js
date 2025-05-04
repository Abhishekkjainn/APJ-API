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
