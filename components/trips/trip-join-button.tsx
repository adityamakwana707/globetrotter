'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TripJoinButtonProps {
  tripId: number;
  tripName: string;
}

export function TripJoinButton({ tripId, tripName }: TripJoinButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleJoin = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/trips/${tripId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'join' }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `You've joined "${tripName}"!`,
        });
        // Refresh the page to show chat
        window.location.reload();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to join trip',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to join trip',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleJoin}
      disabled={isLoading}
      className="w-full sm:w-auto"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Joining...
        </>
      ) : (
        <>
          <Users className="h-4 w-4 mr-2" />
          Join Trip
        </>
      )}
    </Button>
  );
}