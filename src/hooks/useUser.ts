import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useEffect, useState } from "react";
import { User } from "@prisma/client";

export function useUser() {
  const { user: kindeUser, isLoading: isKindeLoading } = useKindeBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      if (!kindeUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [kindeUser]);

  return {
    user,
    isLoading: isLoading || isKindeLoading,
    kindeUser,
  };
} 