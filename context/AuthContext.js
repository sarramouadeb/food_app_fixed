import { onAuthStateChanged } from "firebase/auth";
import React, { createContext, useEffect, useState } from "react";
import { auth } from "../config/FirebaseConfig";


export const AuthContext = createContext({});
export function AuthProvider({ children }) {
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);
useEffect (() => {
const unsub = onAuthStateChanged(auth, u => {
setUser(u);
setLoading(false);
});
return unsub;
}, []);
return (
<AuthContext.Provider value={{ user, loading, setUser } }>
{children}
</AuthContext.Provider>
);
}