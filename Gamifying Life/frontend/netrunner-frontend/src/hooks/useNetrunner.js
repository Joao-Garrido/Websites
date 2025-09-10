import { useState, useEffect, useCallback } from 'react';
import ApiService from '../services/api';

export const useNetrunner = (netrunnerId) => {
  const [netrunner, setNetrunner] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [dataStream, setDataStream] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!netrunnerId) return;
    
    try {
      setLoading(true);
      const data = await ApiService.getDashboardData(netrunnerId);
      
      setNetrunner(data.netrunner);
      setContracts(data.active_contracts || []);
      setDataStream(data.data_stream || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [netrunnerId]);

  const createContract = useCallback(async (contractData) => {
    try {
      const newContract = await ApiService.createContract(netrunnerId, contractData);
      setContracts(prev => [newContract, ...prev]);
      
      // Refresh dashboard to get updated data stream
      await fetchDashboardData();
      
      return newContract;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [netrunnerId, fetchDashboardData]);

  const startContract = useCallback(async (contractId) => {
    try {
      const updatedContract = await ApiService.startContract(contractId);
      
      setContracts(prev => 
        prev.map(contract => 
          contract.id === contractId ? updatedContract : contract
        )
      );
      
      // Refresh dashboard to get updated data stream
      await fetchDashboardData();
      
      return updatedContract;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchDashboardData]);

  const completeContract = useCallback(async (contractId, completionData = {}) => {
    try {
      const result = await ApiService.completeContract(contractId, completionData);
      
      // Update netrunner stats
      setNetrunner(result.netrunner);
      
      // Remove completed contract from active contracts
      setContracts(prev => 
        prev.filter(contract => contract.id !== contractId)
      );
      
      // Refresh dashboard to get updated data stream
      await fetchDashboardData();
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchDashboardData]);

  const spendBandwidth = useCallback(async (amount, activity) => {
    try {
      const updatedNetrunner = await ApiService.spendBandwidth(netrunnerId, amount, activity);
      setNetrunner(updatedNetrunner);
      
      // Refresh dashboard to get updated data stream
      await fetchDashboardData();
      
      return updatedNetrunner;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [netrunnerId, fetchDashboardData]);

  const resetDailyBandwidth = useCallback(async () => {
    try {
      const result = await ApiService.resetDailyBandwidth(netrunnerId);
      setNetrunner(result.netrunner);
      
      // Refresh dashboard to get updated data stream
      await fetchDashboardData();
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [netrunnerId, fetchDashboardData]);

  const setupDemoData = useCallback(async () => {
    try {
      await ApiService.setupDemoData(netrunnerId);
      await fetchDashboardData();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [netrunnerId, fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    netrunner,
    contracts,
    dataStream,
    loading,
    error,
    actions: {
      createContract,
      startContract,
      completeContract,
      spendBandwidth,
      resetDailyBandwidth,
      setupDemoData,
      refresh: fetchDashboardData
    }
  };
};

