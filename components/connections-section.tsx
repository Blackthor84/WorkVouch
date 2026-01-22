import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import {
  UserGroupIcon,
  UserCircleIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

interface Connection {
  id: string;
  connected_user: {
    id: string;
    full_name: string;
    email: string;
    city: string | null;
    state: string | null;
    profile_photo_url: string | null;
  } | null;
}

export function ConnectionsSection({
  connections,
}: {
  connections: Connection[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserGroupIcon className="h-6 w-6 text-primary" />
          Connections ({connections.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {connections.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <UserGroupIcon className="h-12 w-12 text-grey-light dark:text-gray-500 mx-auto mb-4" />
              <p className="text-grey-dark dark:text-gray-200 font-bold mb-2">
                No connections yet.
              </p>
              <p className="text-sm text-grey-dark dark:text-gray-200 font-semibold">
                Connect with coworkers to build your network.
              </p>
            </div>
          ) : (
            connections.map((connection) => (
              <div
                key={connection.id}
                className="rounded-xl border border-grey-background dark:border-[#374151] p-4 hover:shadow-lg transition-all duration-200 hover:border-primary/20"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {connection.connected_user?.profile_photo_url ? (
                      <img
                        src={connection.connected_user.profile_photo_url}
                        alt={connection.connected_user.full_name}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <UserCircleIcon className="h-8 w-8 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-grey-dark dark:text-gray-200 truncate">
                      {connection.connected_user?.full_name || "Unknown User"}
                    </h3>
                    <p className="text-sm text-grey-dark dark:text-gray-200 font-semibold truncate mt-1">
                      {connection.connected_user?.email}
                    </p>
                    {(connection.connected_user?.city ||
                      connection.connected_user?.state) && (
                      <div className="flex items-center gap-1 text-sm text-grey-dark dark:text-gray-200 font-semibold mt-2">
                        <MapPinIcon className="h-4 w-4" />
                        <span>
                          {[
                            connection.connected_user?.city,
                            connection.connected_user?.state,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
