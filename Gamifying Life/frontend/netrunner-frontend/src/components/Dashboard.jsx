import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Terminal, 
  Zap, 
  DollarSign, 
  Clock, 
  Activity,
  Play,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useNetrunner } from '../hooks/useNetrunner';
import './Dashboard.css';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [glitchActive, setGlitchActive] = useState(false);
  
  // For demo purposes, using a hardcoded netrunner ID
  // In a real app, this would come from authentication/routing
  const DEMO_NETRUNNER_ID = 1;
  
  const {
    netrunner,
    contracts,
    dataStream,
    loading,
    error,
    actions
  } = useNetrunner(DEMO_NETRUNNER_ID);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Random glitch effect
    const glitchTimer = setInterval(() => {
      if (Math.random() < 0.05) { // 5% chance every 3 seconds
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 300);
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(glitchTimer);
    };
  }, []);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Low-Profile": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Standard-Op": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "High-Stakes": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getBandwidthStatus = () => {
    if (!netrunner) return "text-gray-400";
    const percentage = (netrunner.current_bandwidth / netrunner.max_bandwidth) * 100;
    if (percentage < 25) return "text-red-400";
    if (percentage < 50) return "text-yellow-400";
    return "text-green-400";
  };

  const handleStartContract = async (contractId) => {
    try {
      await actions.startContract(contractId);
    } catch (error) {
      console.error('Failed to start contract:', error);
    }
  };

  const handleCompleteContract = async (contractId) => {
    try {
      await actions.completeContract(contractId, {
        time_spent: 1.0, // This would come from a timer in a real implementation
        debrief: "Task completed successfully" // This would come from a form
      });
    } catch (error) {
      console.error('Failed to complete contract:', error);
    }
  };

  const handleSetupDemo = async () => {
    try {
      await actions.setupDemoData();
    } catch (error) {
      console.error('Failed to setup demo data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid-pattern flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground">Initializing Neural Interface...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background grid-pattern flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">Connection Error: {error}</p>
          <Button onClick={actions.refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  if (!netrunner) {
    return (
      <div className="min-h-screen bg-background grid-pattern flex items-center justify-center">
        <div className="text-center">
          <Terminal className="h-8 w-8 text-primary mx-auto mb-4" />
          <p className="text-foreground mb-4">No Netrunner profile found</p>
          <Button onClick={handleSetupDemo}>
            Initialize Demo Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background grid-pattern ${glitchActive ? 'glitch' : ''}`}>
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Terminal className="h-8 w-8 text-primary neon-text" />
              <div>
                <h1 className="text-2xl font-bold neon-text">COMMAND LINE</h1>
                <p className="text-sm text-muted-foreground">
                  {currentTime.toLocaleTimeString()} | System Status: ONLINE
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSetupDemo} variant="outline" size="sm">
                Setup Demo
              </Button>
              <Button className="holographic">
                <Zap className="h-4 w-4 mr-2" />
                Jack In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Vitals */}
          <div className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span>NETRUNNER ID</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-primary neon-text">{netrunner.alias}</h3>
                  <p className="text-sm text-muted-foreground">Deck Ver. {netrunner.level}</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>EXP</span>
                      <span>{netrunner.exp}/{netrunner.exp_to_next}</span>
                    </div>
                    <Progress 
                      value={(netrunner.exp / netrunner.exp_to_next) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Bandwidth</span>
                      <span className={getBandwidthStatus()}>
                        {netrunner.current_bandwidth.toFixed(1)}/{netrunner.max_bandwidth} BW
                      </span>
                    </div>
                    <Progress 
                      value={(netrunner.current_bandwidth / netrunner.max_bandwidth) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Credits</span>
                    <span className="text-accent font-mono">¥{netrunner.credits.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {netrunner.signal_debt && (
              <Card className="bg-destructive/20 border-destructive/50 glitch">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span className="text-destructive font-bold">SIGNAL DEBT DETECTED</span>
                  </div>
                  <p className="text-sm text-destructive/80 mt-2">
                    System performance degraded. -25% EXP/¥ penalty active.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Center Column - Active Contracts */}
          <div className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Terminal className="h-5 w-5 text-primary" />
                    <span>MISSION BRIEFING</span>
                  </div>
                  <Badge variant="outline" className="text-accent border-accent/50">
                    {contracts.length} Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contracts.length === 0 ? (
                  <div className="text-center py-8">
                    <Terminal className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No active contracts</p>
                    <Button onClick={handleSetupDemo} variant="outline" size="sm" className="mt-2">
                      Load Demo Contracts
                    </Button>
                  </div>
                ) : (
                  contracts.map((contract) => (
                    <div 
                      key={contract.id}
                      className="p-4 rounded-lg bg-secondary/50 border border-border/30 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{contract.title}</h4>
                        <Badge className={getDifficultyColor(contract.difficulty)}>
                          {contract.difficulty}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{contract.time_estimate}h</span>
                        </span>
                        <span>{contract.progress}% Complete</span>
                      </div>
                      
                      {contract.progress > 0 && (
                        <Progress value={contract.progress} className="h-1 mb-3" />
                      )}
                      
                      <Button 
                        size="sm" 
                        className="w-full"
                        variant={contract.status === 'active' ? 'default' : 'outline'}
                        onClick={() => contract.status === 'active' 
                          ? handleCompleteContract(contract.id)
                          : handleStartContract(contract.id)
                        }
                      >
                        {contract.status === 'active' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complete Hack
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Initiate Hack
                          </>
                        )}
                      </Button>
                    </div>
                  ))
                )}
                
                <Button variant="outline" className="w-full mt-4">
                  <Terminal className="h-4 w-4 mr-2" />
                  Access Mission Control
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Data Stream */}
          <div className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <span>DATA STREAM</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {dataStream.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm">No recent activity</p>
                    </div>
                  ) : (
                    dataStream.map((entry) => (
                      <div 
                        key={entry.id}
                        className="p-3 rounded bg-secondary/30 border-l-2 border-accent/50 data-stream"
                      >
                        <p className="text-sm font-mono">{entry.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{entry.timestamp}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-sm">QUICK ACTIONS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Black Market
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Zap className="h-4 w-4 mr-2" />
                  Cyberdeck
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  System Diagnostics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

