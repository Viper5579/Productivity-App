import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../core/api-client';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Card } from '../../../shared/components/Card';

const canvasSchema = z.object({
  canvasUrl: z.string().url('Invalid Canvas URL'),
  accessToken: z.string().min(1, 'Access token is required'),
});

type CanvasFormData = z.infer<typeof canvasSchema>;

interface CanvasConnection {
  id: string;
  canvasUrl: string;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
}

export function CanvasSetupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CanvasFormData>({
    resolver: zodResolver(canvasSchema),
  });

  // Fetch existing connections
  const { data: connections, isLoading: isLoadingConnections } = useQuery({
    queryKey: ['canvas-connections'],
    queryFn: async () => {
      const response = await apiClient.get('/canvas/connections');
      return response.data.data.connections as CanvasConnection[];
    },
  });

  // Create connection mutation
  const createMutation = useMutation({
    mutationFn: async (data: CanvasFormData) => {
      const response = await apiClient.post('/canvas/connections', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvas-connections'] });
      reset();
      setError(null);
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.error || 'Failed to connect to Canvas. Please check your credentials.'
      );
    },
  });

  // Sync connection mutation
  const syncMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await apiClient.post(`/canvas/connections/${connectionId}/sync`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvas-connections'] });
    },
  });

  // Delete connection mutation
  const deleteMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await apiClient.delete(`/canvas/connections/${connectionId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvas-connections'] });
    },
  });

  const onSubmit = (data: CanvasFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Canvas LMS Setup</h1>
          <Button onClick={() => navigate('/')} variant="secondary">
            Back to Dashboard
          </Button>
        </div>

        {/* Add new connection */}
        <Card title="Add Canvas Connection" className="mb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Input
              label="Canvas URL"
              type="url"
              placeholder="https://your-school.instructure.com"
              helpText="Your Canvas LMS URL (e.g., https://canvas.university.edu)"
              error={errors.canvasUrl?.message}
              {...register('canvasUrl')}
            />

            <Input
              label="Access Token"
              type="password"
              placeholder="Enter your Canvas API token"
              helpText="Generate from Canvas: Account > Settings > New Access Token"
              error={errors.accessToken?.message}
              {...register('accessToken')}
            />

            <Button
              type="submit"
              isLoading={createMutation.isPending}
              disabled={createMutation.isPending}
            >
              Connect to Canvas
            </Button>
          </form>
        </Card>

        {/* Existing connections */}
        <Card title="Your Canvas Connections">
          {isLoadingConnections ? (
            <p className="text-gray-600">Loading connections...</p>
          ) : connections && connections.length > 0 ? (
            <div className="space-y-4">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {connection.canvasUrl}
                    </p>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                      <span
                        className={
                          connection.isActive
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }
                      >
                        {connection.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {connection.lastSyncAt && (
                        <span>
                          Last sync: {new Date(connection.lastSyncAt).toLocaleString()}
                        </span>
                      )}
                      {connection.lastSyncStatus && (
                        <span
                          className={
                            connection.lastSyncStatus === 'success'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {connection.lastSyncStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => syncMutation.mutate(connection.id)}
                      isLoading={syncMutation.isPending}
                    >
                      Sync Now
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (confirm('Are you sure you want to remove this connection?')) {
                          deleteMutation.mutate(connection.id);
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">
              No Canvas connections yet. Add one above to get started.
            </p>
          )}
        </Card>

        {/* Instructions */}
        <Card title="How to get your Canvas API Token" className="mt-8">
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Log in to your Canvas LMS account</li>
            <li>Click on "Account" in the left navigation menu</li>
            <li>Click on "Settings"</li>
            <li>Scroll down to "Approved Integrations"</li>
            <li>Click "+ New Access Token"</li>
            <li>Give it a purpose (e.g., "Productivity App")</li>
            <li>Click "Generate Token"</li>
            <li>Copy the token and paste it above</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
