import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Player, isStaffPosition } from '../types';
import { STAFF_PLACEHOLDER } from '../playerPlaceholders';
import { Shield, Zap, Search, RefreshCw, UserCheck, Play, Save, ChevronRight, HelpCircle, User, Info, BarChart2, Edit, Trash2, Plus, Check, Filter, Tag, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TacticsViewProps {
  players: Player[];
  teamCoach: string;
  teamName?: string;
  onUpdatePlayer?: (updated: Player) => void;
}

// Definition of default legend guest players to backfill if we need them, or to enjoy eFootball style card look!
interface TacticsPlayer {
  id: string;
  name: string;
  rating: number;
  position: string;
  condition: 'A' | 'B' | 'C' | 'D';
  photoUrl: string;
  isLegend?: boolean;
  attributes?: {
    speed: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physicalness: number;
  };
  number?: number;
  bio?: string;
  gamesPlayed?: number;
  points?: number;
  assists?: number;
  cleanSheetsOrRebounds?: number;
  minutesPlayed?: number;
  mvpAwards?: number;
  yellowCards?: number;
  redCards?: number;
  registrationStatus?: 'Active' | 'Pending' | 'Suspended';
}

const MATCH_FORMAT_CONFIG = {
  '11-a-side': {
    size: 11,
    formations: [
      '4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '4-1-2-3',
      '3-4-3', '4-1-4-1', '5-3-2', '5-4-1', '4-5-1',
      '4-3-1-2', '3-4-2-1', '4-4-1-1', '4-3-2-1'
    ]
  },
  '7-a-side': {
    size: 7,
    formations: [
      '2-3-1', '3-2-1', '2-1-2-1', '1-3-2',
      '2-2-2', '3-1-2', '1-2-1-2', '1-4-1'
    ]
  },
  '5-a-side': {
    size: 5,
    formations: [
      '1-2-1', '2-1-1', '1-1-2', '2-0-2',
      '1-3-0', '0-2-2', '1-0-3'
    ]
  }
} as const;

type MatchFormat = keyof typeof MATCH_FORMAT_CONFIG;

const PLAYSTYLE_OPTIONS = ['Quick Counter', 'Possession Game', 'Long Ball Counter', 'Out Wide'];

export default function TacticsView({ players, teamCoach, teamName, onUpdatePlayer }: TacticsViewProps) {
  const [matchFormat, setMatchFormat] = useState<MatchFormat>(() => {
    return (localStorage.getItem('squad_match_format') as MatchFormat) || '11-a-side';
  });
  const [formation, setFormation] = useState<string>(() => localStorage.getItem('squad_formation') || '4-1-2-3');
  const [playstyle, setPlaystyle] = useState<string>(() => localStorage.getItem('squad_playstyle') || 'Quick Counter');
  const [activeTab, setActiveTab] = useState<'Tactics' | 'Team' | 'Substitutes' | 'Reserves'>('Tactics');
  
  // Custom Strategy Mode States
  const [isCustomMode, setIsCustomMode] = useState<boolean>(() => {
    return localStorage.getItem('squad_is_custom_strategy') === 'true';
  });
  const [customFormationInput, setCustomFormationInput] = useState<string>(() => {
    return localStorage.getItem('squad_custom_formation_val') || '4-2-3-1';
  });
  const [customPlaystyleInput, setCustomPlaystyleInput] = useState<string>(() => {
    return localStorage.getItem('squad_custom_playstyle_val') || 'Direct Attacking Tiki-Taka';
  });
  const [customDefensiveInput, setCustomDefensiveInput] = useState<string>(() => {
    return localStorage.getItem('squad_custom_defensive_val') || 'Aggressive Wing Press';
  });
  const [customMentality, setCustomMentality] = useState<string>(() => {
    return localStorage.getItem('squad_custom_mentality_val') || 'Balanced';
  });
  const [customStrategyNotes, setCustomStrategyNotes] = useState<string>(() => {
    return localStorage.getItem('squad_custom_strategy_notes') || 'Focus on rapid mid-block transitional overload. Fullbacks overlap actively while DMF covers the backline.';
  });
  
  const [isEditingCoach, setIsEditingCoach] = useState<boolean>(false);
  const rosterCoach = useMemo(() => {
    const normalizedTeamCoach = teamCoach.trim().toLowerCase();
    const staff = players.filter(player => isStaffPosition(player.position));

    return staff.find(player => player.name.trim().toLowerCase() === normalizedTeamCoach)
      || staff.find(player => player.position === 'Manager / Coach')
      || staff.find(player => player.position.toLowerCase().includes('manager'))
      || staff.find(player => player.position.toLowerCase().includes('coach'));
  }, [players, teamCoach]);
  const coachName = rosterCoach?.name || teamCoach || 'Team Manager';
  const coachPhoto = rosterCoach?.photoUrl || STAFF_PLACEHOLDER;
  const [coachLevel, setCoachLevel] = useState<string>(() => localStorage.getItem('squad_coach_level') || 'Expert ★★★★★');

  const [playstyles, setPlaystyles] = useState<string[]>(() => {
    const saved = localStorage.getItem('squad_custom_playstyles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return ['Quick Counter', 'Possession Game', 'Long Ball Counter', 'Out Wide'];
  });

  const [customStyleInput, setCustomStyleInput] = useState<string>('');
  const [showCustomStyleCreator, setShowCustomStyleCreator] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('squad_match_format', matchFormat);
    if (!MATCH_FORMAT_CONFIG[matchFormat].formations.includes(formation) && !isCustomMode) {
      setFormation(MATCH_FORMAT_CONFIG[matchFormat].formations[0]);
    }
    if (isCustomMode && !MATCH_FORMAT_CONFIG[matchFormat].formations.includes(customFormationInput)) {
      setCustomFormationInput(MATCH_FORMAT_CONFIG[matchFormat].formations[0]);
    }
  }, [matchFormat]);

  useEffect(() => {
    localStorage.setItem('squad_coach_level', coachLevel);
  }, [coachLevel]);

  useEffect(() => {
    localStorage.setItem('squad_custom_playstyles', JSON.stringify(playstyles));
  }, [playstyles]);

  useEffect(() => {
    localStorage.setItem('squad_formation', formation);
  }, [formation]);

  useEffect(() => {
    localStorage.setItem('squad_playstyle', playstyle);
  }, [playstyle]);

  useEffect(() => {
    localStorage.setItem('squad_is_custom_strategy', String(isCustomMode));
  }, [isCustomMode]);

  useEffect(() => {
    localStorage.setItem('squad_custom_formation_val', customFormationInput);
  }, [customFormationInput]);

  useEffect(() => {
    localStorage.setItem('squad_custom_playstyle_val', customPlaystyleInput);
  }, [customPlaystyleInput]);

  useEffect(() => {
    localStorage.setItem('squad_custom_defensive_val', customDefensiveInput);
  }, [customDefensiveInput]);

  useEffect(() => {
    localStorage.setItem('squad_custom_mentality_val', customMentality);
  }, [customMentality]);

  useEffect(() => {
    localStorage.setItem('squad_custom_strategy_notes', customStrategyNotes);
  }, [customStrategyNotes]);

  const [captainId, setCaptainId] = useState<string>(() => localStorage.getItem('squad_captain_id') || '');
  const [penaltyTakerId, setPenaltyTakerId] = useState<string>(() => localStorage.getItem('squad_penalty_taker_id') || '');
  const [freeKickTakerId, setFreeKickTakerId] = useState<string>(() => localStorage.getItem('squad_free_kick_taker_id') || '');
  const [cornerTakerId, setCornerTakerId] = useState<string>(() => localStorage.getItem('squad_corner_taker_id') || '');
  const [defensiveStyle, setDefensiveStyle] = useState<string>(() => localStorage.getItem('squad_defensive_style') || 'High Press');

  const activeFormation = isCustomMode ? customFormationInput : formation;
  const activePlaystyle = isCustomMode ? customPlaystyleInput : playstyle;
  const activeDefensiveStyle = isCustomMode ? customDefensiveInput : defensiveStyle;

  useEffect(() => {
    localStorage.setItem('squad_captain_id', captainId);
  }, [captainId]);
  useEffect(() => {
    localStorage.setItem('squad_penalty_taker_id', penaltyTakerId);
  }, [penaltyTakerId]);
  useEffect(() => {
    localStorage.setItem('squad_free_kick_taker_id', freeKickTakerId);
  }, [freeKickTakerId]);
  useEffect(() => {
    localStorage.setItem('squad_corner_taker_id', cornerTakerId);
  }, [cornerTakerId]);
  useEffect(() => {
    localStorage.setItem('squad_defensive_style', defensiveStyle);
  }, [defensiveStyle]);

  // Highlighting active card index selected (0 to 10 starting slot)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(6); // Default: Roberto Carlos (LB - index 6 in default list)
  const [rightPanelTab, setRightPanelTab] = useState<'Basic' | 'Status'>('Basic');

  // Additional states to track status, yellow cards, red cards for each player id
  const [playerStatusExtras, setPlayerStatusExtras] = useState<{
    [playerId: string]: {
      status: 'starting' | 'substitute' | 'injured';
      yellowCards: number;
      redCards: number;
    }
  }>(() => {
    const saved = localStorage.getItem('stack_squad_player_extras');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('stack_squad_player_extras', JSON.stringify(playerStatusExtras));
  }, [playerStatusExtras]);

  // Sync actual player yellowCards/redCards from Player data into local extras
  useEffect(() => {
    const activePlayers = players.filter(p => !isStaffPosition(p.position));
    setPlayerStatusExtras(prev => {
      let changed = false;
      const next = { ...prev };
      activePlayers.forEach(p => {
        const current = next[p.id] || { status: 'starting', yellowCards: 0, redCards: 0 };
        if (current.yellowCards !== (p.yellowCards ?? 0) || current.redCards !== (p.redCards ?? 0)) {
          next[p.id] = {
            ...current,
            yellowCards: p.yellowCards ?? 0,
            redCards: p.redCards ?? 0
          };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [players]);

  const getPlayerExtras = (playerId: string) => {
    return playerStatusExtras[playerId] || { status: 'starting', yellowCards: 0, redCards: 0 };
  };

  const updatePlayerExtras = (playerId: string, updates: Partial<{ status: 'starting' | 'substitute' | 'injured'; yellowCards: number; redCards: number }> | null) => {
    setPlayerStatusExtras(prev => {
      const current = prev[playerId] || { status: 'starting', yellowCards: 0, redCards: 0 };
      return {
        ...prev,
        [playerId]: {
          ...current,
          ...(updates || {})
        }
      };
    });
    // Also sync card changes back to the Player record
    if (updates && (updates.yellowCards !== undefined || updates.redCards !== undefined) && onUpdatePlayer) {
      const player = players.find(p => p.id === playerId);
      if (player) {
        const current = playerStatusExtras[playerId] || { status: 'starting', yellowCards: 0, redCards: 0 };
        onUpdatePlayer({
          ...player,
          yellowCards: updates.yellowCards ?? current.yellowCards,
          redCards: updates.redCards ?? current.redCards
        });
      }
    }
  };

  // Quick Notes persistence state
  const [quickNotes, setQuickNotes] = useState<any[]>(() => {
    const saved = localStorage.getItem('stack_tactics_quick_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'default-1',
        title: 'Counter-Attack Speed Trigger',
        content: 'When possession is regained, look for the overlapping AMF immediately. CF should draw opposing CBs away.',
        category: 'Strategy',
        createdAt: new Date().toISOString()
      },
      {
        id: 'default-2',
        title: 'Near-Post Corner Route',
        content: 'Corner kick taker should send a direct curly cross to the edge of the 6-yard box. Tall CB should block goalie.',
        category: 'Set Pieces',
        createdAt: new Date().toISOString()
      },
      {
        id: 'default-3',
        title: '4-3-3 Transition Shift',
        content: 'If switching to 4-3-3, ensure fullbacks overlap dynamically, and DMF drops into a deep back-three anchor.',
        category: 'Formation',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<'Formation' | 'Set Pieces' | 'Strategy' | 'General'>('Strategy');
  const [notesFilter, setNotesFilter] = useState<string>('All');

  // Inline editing state for individual note
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState('');
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [editingNoteCategory, setEditingNoteCategory] = useState<'Formation' | 'Set Pieces' | 'Strategy' | 'General'>('Strategy');

  useEffect(() => {
    localStorage.setItem('stack_tactics_quick_notes', JSON.stringify(quickNotes));
  }, [quickNotes]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const newNote = {
      id: 'note-' + Date.now(),
      title: noteTitle.trim(),
      content: noteContent.trim(),
      category: noteCategory,
      createdAt: new Date().toISOString()
    };

    setQuickNotes(prev => [newNote, ...prev]);
    setNoteTitle('');
    setNoteContent('');
  };

  const handleStartEditNote = (note: any) => {
    setEditingNoteId(note.id);
    setEditingNoteTitle(note.title);
    setEditingNoteContent(note.content);
    setEditingNoteCategory(note.category || 'General');
  };

  const handleSaveEditNote = (id: string) => {
    if (!editingNoteTitle.trim() || !editingNoteContent.trim()) return;
    setQuickNotes(prev => prev.map(n => n.id === id ? {
      ...n,
      title: editingNoteTitle.trim(),
      content: editingNoteContent.trim(),
      category: editingNoteCategory
    } : n));
    setEditingNoteId(null);
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm('Are you sure you want to delete this tactics reminder note?')) {
      setQuickNotes(prev => prev.filter(n => n.id !== id));
      if (editingNoteId === id) {
        setEditingNoteId(null);
      }
    }
  };

  // Convert active registered club players into state format
  const allEligiblePool: TacticsPlayer[] = useMemo(() => {
    return players
      .filter(p => !isStaffPosition(p.position))
      .map(p => {
        // Calculate average rating
        const attributesSum = p.attributes.speed + p.attributes.shooting + p.attributes.passing + p.attributes.dribbling + p.attributes.defending + p.attributes.physicalness;
        const avg = Math.round(attributesSum / 6);
        return {
          id: p.id,
          name: p.name,
          rating: avg,
          position: p.position === 'Forward' ? 'CF' : p.position === 'Midfielder' ? 'AMF' : p.position === 'Defender' ? 'CB' : 'GK',
          condition: 'B' as const,
          photoUrl: p.photoUrl,
          isLegend: false,
          attributes: p.attributes,
          number: p.number,
          bio: p.bio,
          gamesPlayed: p.gamesPlayed,
          points: p.points,
          assists: p.assists,
          cleanSheetsOrRebounds: p.cleanSheetsOrRebounds,
          minutesPlayed: p.minutesPlayed,
          mvpAwards: p.mvpAwards,
          yellowCards: p.yellowCards,
          redCards: p.redCards,
          registrationStatus: p.registrationStatus
        };
    });
  }, [players]);

  // Maintain actual assignments state for the 11 starting slots
  // Saved inside LocalStorage for persistence
  const [lineup, setLineup] = useState<{ [key: number]: TacticsPlayer }>(() => {
    const saved = localStorage.getItem('stack_squad_lineup');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    // Default lineup prefilled
    const defaultLineup: { [key: number]: TacticsPlayer } = {};
    allEligiblePool.slice(0, 11).forEach((p, idx) => {
      defaultLineup[idx] = {
        id: p.id,
        name: p.name,
        rating: p.rating,
        position: p.position,
        condition: 'B' as const,
        photoUrl: p.photoUrl,
        isLegend: false,
        attributes: p.attributes,
        number: p.number,
        bio: p.bio,
        gamesPlayed: p.gamesPlayed,
        points: p.points,
        assists: p.assists,
        cleanSheetsOrRebounds: p.cleanSheetsOrRebounds,
        minutesPlayed: p.minutesPlayed,
        mvpAwards: p.mvpAwards,
        registrationStatus: p.registrationStatus
      };
    });
    return defaultLineup;
  });

  // Save lineup configuration changes
  useEffect(() => {
    localStorage.setItem('stack_squad_lineup', JSON.stringify(lineup));
  }, [lineup]);

  // Click-and-drag coordinates state for lineup cards
  const [draggedPositions, setDraggedPositions] = useState<Record<number, { left: number; top: number }>>(() => {
    const saved = localStorage.getItem('stack_tactics_dragged_positions');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('stack_tactics_dragged_positions', JSON.stringify(draggedPositions));
  }, [draggedPositions]);

  // Pointer Dragging trackers
  const [activeDragItem, setActiveDragItem] = useState<{ type: 'player' | 'ball' | 'wall'; index?: number } | null>(null);
  const isDragMovingRef = useRef(false);

  // Drawing tools state
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [brushColor, setBrushColor] = useState<string>('#fbbf24'); // default Amber Yellow
  const [brushWidth, setBrushWidth] = useState<number>(3); // stroke thickness
  const [paths, setPaths] = useState<any[]>(() => {
    const saved = localStorage.getItem('stack_tactics_draw_paths');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentPath, setCurrentPath] = useState<{ color: string; width: number; points: [number, number][] } | null>(null);

  // Tactical Aux elements states
  const [showBall, setShowBall] = useState<boolean>(true);
  const [ballPos, setBallPos] = useState<{ left: number; top: number }>({ left: 50, top: 40 }); // slightly ahead of center
  const [showWall, setShowWall] = useState<boolean>(false);
  const [wallPos, setWallPos] = useState<{ left: number; top: number }>({ left: 50, top: 72 });

  // Coordinate positions mapper on soccer field container depending on selected formation
  const fieldPositions = useMemo(() => {
    const defaultGK = { role: 'GK', top: 86, left: 50 };
    const formatSize = MATCH_FORMAT_CONFIG[matchFormat].size;
    const expectedOutfield = formatSize - 1;

    // Resolve which formation string to use
    let resolvedFormation: string;
    if (isCustomMode) {
      resolvedFormation = customFormationInput;
    } else if (matchFormat === '11-a-side') {
      resolvedFormation = formation;
    } else {
      resolvedFormation = formation;
    }

    const parts = resolvedFormation.split('-').map(Number).filter(n => !isNaN(n) && n > 0);
    
    // If parts don't resolve or outfield sum doesn't match the format, fallback to first formation for this format
    let effectiveParts = parts;
    const totalOutfield = parts.reduce((a, b) => a + b, 0);
    if (parts.length === 0 || totalOutfield !== expectedOutfield) {
      const fallbackFmt = MATCH_FORMAT_CONFIG[matchFormat].formations[0];
      effectiveParts = fallbackFmt.split('-').map(Number).filter(n => !isNaN(n) && n > 0);
      if (effectiveParts.length === 0 || effectiveParts.reduce((a, b) => a + b, 0) !== expectedOutfield) {
        // Ultimate fallback per format
        if (matchFormat === '11-a-side') effectiveParts = [4, 3, 3];
        else if (matchFormat === '7-a-side') effectiveParts = [2, 3, 1];
        else effectiveParts = [1, 2, 1];
      }
    }

    const numRows = effectiveParts.length;
    
    const getRowTop = (rowIndex: number) => {
      if (numRows === 1) return 45;
      const minTop = 15;
      const maxTop = 72;
      const ratio = rowIndex / (numRows - 1);
      return Math.round(maxTop - ratio * (maxTop - minTop));
    };

    const positions: { role: string; top: number; left: number }[] = [];

    // Build rows from back (defenders) to front (forwards)
    for (let r = numRows - 1; r >= 0; r--) {
      const count = effectiveParts[r];
      const top = getRowTop(r);

      for (let i = 0; i < count; i++) {
        let left = 50;
        if (count > 1) {
          const minLeft = 16;
          const maxLeft = 84;
          left = Math.round(minLeft + (i / (count - 1)) * (maxLeft - minLeft));
        }

        let role = 'MID';
        if (r === 0) {
          // Defenders row (bottom of pitch)
          if (count === 1) role = 'CB';
          else if (count === 2) role = i === 0 ? 'LB' : 'RB';
          else if (count === 3) role = i === 0 ? 'LCB' : i === 1 ? 'CB' : 'RCB';
          else if (count === 4) role = i === 0 ? 'LB' : i === 1 || i === 2 ? 'CB' : 'RB';
          else if (count === 5) role = i === 0 ? 'LWB' : i === 1 ? 'CB' : i === 2 ? 'CB' : i === 3 ? 'CB' : 'RWB';
          else role = 'DEF';
        } else if (r === numRows - 1) {
          // Forwards row (top of pitch)
          if (count === 1) role = 'CF';
          else if (count === 2) role = i === 0 ? 'LWF' : 'RWF';
          else if (count === 3) role = i === 0 ? 'LWF' : i === 1 ? 'CF' : 'RWF';
          else role = 'FWD';
        } else {
          // Midfield rows
          const isAttackingMid = r === numRows - 2;
          const isDefensiveMid = r === 1 && numRows > 3;
          
          if (isDefensiveMid) {
            role = count === 1 ? 'DMF' : i === 0 ? 'LDMF' : 'RDMF';
          } else if (isAttackingMid) {
            role = count === 1 ? 'AMF' : i === 0 ? 'LAMF' : i === count - 1 ? 'RAMF' : 'AMF';
          } else {
            role = count === 1 ? 'CMF' : i === 0 ? 'LMF' : i === count - 1 ? 'RMF' : 'CMF';
          }
        }
        positions.push({ role, top, left });
      }
    }
    positions.push(defaultGK);
    return positions;
  }, [isCustomMode, customFormationInput, formation, matchFormat]);

  // Sum total OVR points of starting lineup to count "Collective Strength"
  const collectiveStrength = useMemo(() => {
    let sum = 0;
    const size = MATCH_FORMAT_CONFIG[matchFormat].size;
    for (let i = 0; i < size; i++) {
      const p = lineup[i];
      if (p) {
        sum += p.rating;
      }
    }
    // Multiply by average multiplier to get premium eFootball squad score style (e.g. 3000+)
    return Math.round((sum / size) * 31);
  }, [lineup, matchFormat]);

  const activeSelectedPlayer = useMemo(() => {
    return lineup[selectedSlotIndex] || null;
  }, [lineup, selectedSlotIndex]);

  // Handle swapping selected slot's player
  const handleAssignPlayer = (selectedPlayer: TacticsPlayer) => {
    setLineup(prev => {
      const newLineup = { ...prev };
      const size = MATCH_FORMAT_CONFIG[matchFormat].size;
      let existingIndex = -1;
      
      for (let i = 0; i < size; i++) {
        if (newLineup[i]?.id === selectedPlayer.id) {
          existingIndex = i;
          break;
        }
      }

      if (existingIndex !== -1 && existingIndex !== selectedSlotIndex) {
        // Swap players if already on the field
        const prevAtSelected = newLineup[selectedSlotIndex];
        if (prevAtSelected) {
          newLineup[existingIndex] = {
            ...prevAtSelected,
            position: fieldPositions[existingIndex]?.role || prevAtSelected.position
          };
        } else {
          delete newLineup[existingIndex];
        }
      }

      newLineup[selectedSlotIndex] = {
        ...selectedPlayer,
        position: fieldPositions[selectedSlotIndex]?.role || selectedPlayer.position
      };

      return newLineup;
    });
  };

  const handleClearBoard = () => {
    setLineup({});
    setSelectedSlotIndex(0);
    setDraggedPositions({});
    setPaths([]);
    localStorage.removeItem('stack_tactics_draw_paths');
    setBallPos({ left: 50, top: 40 });
    setWallPos({ left: 50, top: 72 });
  };

  const handleClearDrawings = () => {
    setPaths([]);
    localStorage.removeItem('stack_tactics_draw_paths');
    setCurrentPath(null);
  };

  const handleResetPositions = () => {
    setDraggedPositions({});
    setBallPos({ left: 50, top: 40 });
    setWallPos({ left: 50, top: 72 });
  };

  const handleUndoDrawing = () => {
    if (paths.length === 0) return;
    setPaths(prev => {
      const updated = prev.slice(0, -1);
      localStorage.setItem('stack_tactics_draw_paths', JSON.stringify(updated));
      return updated;
    });
  };

  const fieldRef = useRef<HTMLDivElement>(null);

  // Field Pointer events for drawing on pitch in Drawing Mode
  const handleFieldPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawingMode || !fieldRef.current) return;
    
    // Check if dragging an element first
    if (activeDragItem) return;
    
    const rect = fieldRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setCurrentPath({
      color: brushColor,
      width: brushWidth,
      points: [[x, y]]
    });
    
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleFieldPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawingMode || !currentPath || !fieldRef.current) return;
    
    const rect = fieldRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    setCurrentPath(prev => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, [clampedX, clampedY]]
      };
    });
  };

  const handleFieldPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (currentPath) {
      setPaths(prev => {
        const updated = [...prev, currentPath];
        localStorage.setItem('stack_tactics_draw_paths', JSON.stringify(updated));
        return updated;
      });
      setCurrentPath(null);
    }
  };

  // Element Specific Dragging handlers (incorporating pointer-capture)
  const handleElementPointerDown = (e: React.PointerEvent, type: 'player' | 'ball' | 'wall', index?: number) => {
    if (isDrawingMode) return;
    e.stopPropagation();
    setActiveDragItem({ type, index });
    isDragMovingRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleElementPointerMove = (e: React.PointerEvent) => {
    if (!activeDragItem || !fieldRef.current) return;
    e.stopPropagation();
    
    const rect = fieldRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Clamp to 0-100% margins
    const leftPercent = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
    const topPercent = Math.max(0, Math.min(100, Math.round((y / rect.height) * 100)));
    
    isDragMovingRef.current = true;
    
    if (activeDragItem.type === 'player' && activeDragItem.index !== undefined) {
      const idx = activeDragItem.index;
      setDraggedPositions(prev => ({
        ...prev,
        [idx]: { left: leftPercent, top: topPercent }
      }));
    } else if (activeDragItem.type === 'ball') {
      setBallPos({ left: leftPercent, top: topPercent });
    } else if (activeDragItem.type === 'wall') {
      setWallPos({ left: leftPercent, top: topPercent });
    }
  };

  const handleElementPointerUp = (e: React.PointerEvent) => {
    if (activeDragItem) {
      setActiveDragItem(null);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleRemovePlayer = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setLineup(prev => {
      const newLineup = { ...prev };
      delete newLineup[index];
      return newLineup;
    });
  };

  // Substitutes & Reserves (for aesthetic sidebar layout)
  const substitutes = useMemo(() => {
    // Players in pool not currently chosen in starting lineup
    const size = MATCH_FORMAT_CONFIG[matchFormat].size;
    const activeLineupIds = new Set<string>();
    for (let i = 0; i < size; i++) {
      if (lineup[i]) {
        activeLineupIds.add(lineup[i].id);
      }
    }
    return allEligiblePool.filter(p => !activeLineupIds.has(p.id));
  }, [allEligiblePool, lineup, matchFormat]);

  return (
    <div id="tactics-view-container" className="grid grid-cols-1 xl:grid-cols-12 gap-6 bg-slate-900 p-6 rounded-3xl border border-slate-800 text-slate-100 shadow-2xl relative overflow-hidden">
      
      {/* Visual background ambient glow elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-650/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* LEFT SIDE PANEL FOR NAVIGATION & CONTROLS */}
      <div className="xl:col-span-3 flex flex-col gap-5 relative z-10">
        
        {/* Coach Details Widget */}
        <div className="bg-[#0f172a]/95 p-4 rounded-2xl border border-slate-800/80 shadow-md">
          {isEditingCoach ? (
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/80">
                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest">Edit Coach Details</span>
                <button 
                  id="btn-save-coach-details"
                  onClick={() => setIsEditingCoach(false)} 
                  className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded-md transition-all shadow shadow-emerald-700/20"
                >
                  SAVE
                </button>
              </div>
              
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black block mb-1">Roster Manager / Coach</span>
                <div className="flex items-center gap-2">
                  <img
                    src={coachPhoto}
                    alt={coachName}
                    className="h-8 w-8 rounded-lg border border-amber-400/60 object-cover"
                  />
                  <span className="text-xs font-bold text-slate-100">{coachName}</span>
                </div>
                <p className="mt-1.5 text-[9px] leading-relaxed text-slate-500">
                  Name and photo are synchronized from the Roster profile.
                </p>
              </div>

              <div>
                <label className="text-[9px] text-slate-400 uppercase tracking-widest font-black block mb-0.5">Tactics Level</label>
                <input 
                  id="input-coach-level"
                  type="text" 
                  value={coachLevel} 
                  onChange={(e) => setCoachLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={coachPhoto} 
                    alt="Coach photo" 
                    className="w-14 h-14 rounded-xl object-cover border border-amber-400 shadow shadow-amber-400/20"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] px-1 rounded shadow-sm">MGR</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 uppercase tracking-widest font-black block">TEAM TACTICIAN</span>
                  <h3 className="font-display font-black text-slate-100 text-sm leading-tight">{coachName}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{coachLevel}</p>
                </div>
              </div>

              <button
                id="btn-trigger-edit-coach"
                onClick={() => setIsEditingCoach(true)}
                className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-amber-400 rounded-lg transition-all"
                title="Edit Coach Details"
              >
                ✏️
              </button>
            </div>
          )}
        </div>

        {/* Flag Box / Team Brand Crest Widget */}
        <div className="bg-[#0f172a]/95 p-4.5 rounded-2xl border border-slate-800/80 shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Styled Team Flag inspired by eFootball flag widget */}
            <div className="shrink-0 w-16 h-10 rounded-sm border border-slate-600 overflow-hidden relative shadow shadow-indigo-900/30">
              <div className="absolute inset-x-0 top-0 bottom-1/2 bg-blue-600" />
              <div className="absolute inset-x-0 bottom-0 top-1/2 bg-red-600" />
              <div className="absolute inset-y-0 left-0 w-7 bg-white flex items-center justify-center [clip-path:polygon(0%_0%,_100%_50%,_0%_100%)]">
                <span className="text-[10px] text-amber-500 font-bold">★</span>
              </div>
            </div>
            <div>
              <h4 className="font-display font-black text-sm tracking-wide text-white">{teamName || "Apex Rangers"}</h4>
              <span className="text-[10px] text-slate-400 block -mt-0.5 uppercase tracking-wider font-semibold">Home Stadium Arena</span>
            </div>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded font-bold font-mono">CLUB</span>
        </div>

        {/* Squad Selection Buttons & Modes */}
        <div className="bg-[#0f172a]/95 p-3.5 rounded-2xl border border-slate-800/80 space-y-1.5 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block px-2 pb-1.5 border-b border-slate-800">Squad Directory</span>
          
          <button
            id="sidebar-team"
            onClick={() => setActiveTab('Team')}
            className={`w-full py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2.5 ${
              activeTab === 'Team' 
                ? 'bg-slate-800 text-white border-l-4 border-amber-400 pl-2' 
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <UserCheck size={14} className="text-amber-400" />
            <span>Starting {MATCH_FORMAT_CONFIG[matchFormat].size} roster</span>
          </button>

          <button
            id="sidebar-substitutes"
            onClick={() => setActiveTab('Substitutes')}
            className={`w-full py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2.5 ${
              activeTab === 'Substitutes' 
                ? 'bg-slate-800 text-white border-l-4 border-amber-400 pl-2' 
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Zap size={14} className="text-amber-400 animate-pulse" />
            <span>Substitutes ({substitutes.length})</span>
          </button>

          <button
            id="sidebar-reserves"
            onClick={() => setActiveTab('Reserves')}
            className={`w-full py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2.5 ${
              activeTab === 'Reserves' 
                ? 'bg-slate-800 text-white border-l-4 border-amber-400 pl-2' 
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Shield size={14} className="text-indigo-400" />
            <span>Reserves ({allEligiblePool.length})</span>
          </button>
        </div>

        {/* Dedicated Tactic Configuration & Plays Section Card */}
        <div className="bg-[#0f172a]/95 p-4 rounded-2xl border border-slate-800/80 shadow-md">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest">TACTICS CONTROL</span>
            <span className="text-[9px] text-slate-400 font-mono">Formations & Plays</span>
          </div>
          <button 
            id="sidebar-tactics"
            onClick={() => setActiveTab(activeTab === 'Tactics' ? 'Team' : 'Tactics')}
            className={`w-full py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === 'Tactics' 
                ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/20' 
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <span>Tactic Configuration & Plays</span>
            <ChevronRight size={13} className={`transition-transform duration-200 ${activeTab === 'Tactics' ? 'rotate-90' : ''}`} />
          </button>
          <div className="mt-3.5 space-y-2 text-[11px] text-slate-400 font-mono border-t border-slate-800/50 pt-2.5">
            <div className="flex justify-between">
              <span>Formation:</span>
              <span id="sidebar-val-formation" className="text-white font-bold">{activeFormation}</span>
            </div>
            <div className="flex justify-between">
              <span>Playstyle:</span>
              <span id="sidebar-val-playstyle" className="text-amber-300 font-bold">{activePlaystyle}</span>
            </div>
            <div className="flex justify-between">
              <span>Defense:</span>
              <span id="sidebar-val-defense" className="text-emerald-400 font-bold">{activeDefensiveStyle}</span>
            </div>
            {isCustomMode && (
              <>
                <div className="flex justify-between">
                  <span>Mentality:</span>
                  <span id="sidebar-val-mentality" className="text-indigo-400 font-bold">{customMentality}</span>
                </div>
                <div className="border-t border-slate-800/30 pt-1.5 mt-1">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold mb-0.5">Custom Plan Notes:</span>
                  <p id="sidebar-val-notes" className="text-[10px] text-slate-400 italic font-sans leading-tight leading-relaxed">{customStrategyNotes}</p>
                </div>
              </>
            )}
          </div>
        </div>

      </div>


      {/* MAIN SOCCER PITCH AREA */}
      <div className="xl:col-span-6 flex flex-col bg-emerald-950/20 rounded-3xl p-4 border border-slate-800 relative z-10">
        
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-black text-white text-sm tracking-widest uppercase text-emerald-400">Match Layout</h3>
          <button
            onClick={handleClearBoard}
            className="text-[7px] uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-1 rounded-lg font-normal hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1"
          >
            Clear Board
          </button>
        </div>

        {/* Render interactive Tactical Pitch Board */}
        <div 
          id="tactical-field-card" 
          ref={fieldRef}
          onPointerDown={handleFieldPointerDown}
          onPointerMove={handleFieldPointerMove}
          onPointerUp={handleFieldPointerUp}
          className="relative w-full max-w-[720px] aspect-[7/10] mx-auto bg-[#132c1b] rounded-2xl overflow-hidden border border-emerald-900/60 shadow-lg select-none"
        >
          
          {/* Soccer pitch physical markings overlay */}
          <div className="absolute inset-4 border-2 border-slate-100/5 rounded-xl pointer-events-none">
            {/* Center Line & Circle */}
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-slate-100/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-slate-100/5" />
            
            {/* Top Penalty Box */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 border-b-2 border-x-2 border-slate-100/5">
              {/* Goal area box */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-10 border-b-2 border-x-2 border-slate-100/5" />
            </div>
            
            {/* Bottom Penalty Box */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-24 border-t-2 border-x-2 border-slate-100/5">
              {/* Goal area box */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-10 border-t-2 border-x-2 border-slate-100/5" />
            </div>
          </div>

          {/* Grass elegant radial texture */}
          <div className="absolute inset-0 bg-gradient-radial from-[#1e4a2a] via-[#13321d] to-[#0a1a0f] opacity-80 pointer-events-none" />

          {/* COACH DRAWING PATHS SVG LAYER (Absolute Overlay) */}
          <svg 
            viewBox="0 0 100 100" 
            className="absolute inset-0 w-full h-full select-none"
            style={{ zIndex: isDrawingMode ? 30 : 10, pointerEvents: isDrawingMode ? 'auto' : 'none' }}
          >
            {paths.map((p, idx) => (
              <path
                key={idx}
                d={p.points.map((pt: any, i: number) => `${i === 0 ? 'M' : 'L'} ${pt[0]} ${pt[1]}`).join(' ')}
                stroke={p.color}
                strokeWidth={p.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {currentPath && (
              <path
                d={currentPath.points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt[0]} ${pt[1]}`).join(' ')}
                stroke={currentPath.color}
                strokeWidth={currentPath.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>

          {/* Rendering the Starting cards at calculated coordinates */}
          {fieldPositions.map((pos, idx) => {
            const player = lineup[idx];
            const isSelected = selectedSlotIndex === idx;
            const currentPos = draggedPositions[idx] || { top: pos.top, left: pos.left };
            
            if (!player) {
              return (
                <motion.button
                  id={`field-player-slot-${idx}-empty`}
                  key={idx}
                  style={{ top: `${currentPos.top}%`, left: `${currentPos.left}%` }}
                  onClick={(e) => {
                    if (isDragMovingRef.current) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    setSelectedSlotIndex(idx);
                  }}
                  onPointerDown={(e) => handleElementPointerDown(e, 'player', idx)}
                  onPointerUp={handleElementPointerUp}
                  onPointerMove={handleElementPointerMove}
                  className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none z-20 group cursor-grab active:cursor-grabbing"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSelected && (
                    <div className="absolute -inset-3 border-2 border-cyan-400 rounded-xl" style={{ clipPath: 'polygon(0% 0%, 25% 0%, 25% 10%, 0% 10%, 0% 100%, 10% 100%, 10% 25%, 0% 25%, 0% 0%, 100% 0%, 100% 25%, 90% 25%, 90% 10%, 100% 10%, 100% 100%, 90% 100%, 90% 25%, 100% 25%, 100% 0%, 0% 0%)' }}>
                      <span className="absolute top-[-5px] left-[-5px] w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400" />
                      <span className="absolute top-[-5px] right-[-5px] w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400" />
                      <span className="absolute bottom-[-5px] left-[-5px] w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400" />
                      <span className="absolute bottom-[-5px] right-[-5px] w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400" />
                    </div>
                  )}
                  <div className="relative w-18 h-22 rounded-lg bg-slate-900/50 border border-slate-700 p-0.5 shadow-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-800 transition-all border-dashed select-none">
                    <span className="text-[10px] font-bold text-slate-400 opacity-60">EMPTY</span>
                    <span className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-wider">{pos.role}</span>
                  </div>
                </motion.button>
              );
            }

            return (
              <motion.div
                id={`field-player-slot-${idx}`}
                key={idx}
                style={{ top: `${currentPos.top}%`, left: `${currentPos.left}%` }}
                onClick={(e) => {
                  if (isDragMovingRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  setSelectedSlotIndex(idx);
                }}
                onPointerDown={(e) => handleElementPointerDown(e, 'player', idx)}
                onPointerUp={handleElementPointerUp}
                onPointerMove={handleElementPointerMove}
                className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none z-20 group cursor-grab active:cursor-grabbing"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                
                {/* Visual active highlights brackets around cards just like Roberto Carlos in eFootball reference! */}
                {isSelected && (
                  <div className="absolute -inset-3 border-2 border-cyan-400 rounded-xl" style={{ clipPath: 'polygon(0% 0%, 25% 0%, 25% 10%, 0% 10%, 0% 100%, 10% 100%, 10% 25%, 0% 25%, 0% 0%, 100% 0%, 100% 25%, 90% 25%, 90% 10%, 100% 10%, 100% 100%, 90% 100%, 90% 25%, 100% 25%, 100% 0%, 0% 0%)' }}>
                    <span className="absolute top-[-5px] left-[-5px] w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400" />
                    <span className="absolute top-[-5px] right-[-5px] w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400" />
                    <span className="absolute bottom-[-5px] left-[-5px] w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400" />
                    <span className="absolute bottom-[-5px] right-[-5px] w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400" />
                  </div>
                )}

                {/* Highly structured Gold Foil Player Card inspired by the eFootball design reference */}
                <div className={`relative w-18 h-22 rounded-lg bg-gradient-to-b ${
                  player.isLegend ? 'from-amber-200 via-amber-400 to-amber-700' : 'from-indigo-300 via-blue-500 to-slate-800'
                } p-0.5 shadow-xl shadow-black/80 flex flex-col justify-between overflow-hidden text-slate-100 hover:shadow-cyan-500/20 transition-all ${
                  getPlayerExtras(player.id).status === 'injured' ? 'opacity-60 saturate-50' : ''
                } ${
                  getPlayerExtras(player.id).redCards > 0 ? 'border border-red-500 ring-2 ring-red-500/50' : ''
                }`}>
                  
                  {/* Subtle shining gradient animation overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                  {/* Top line of card info */}
                  <div className="flex items-center justify-between px-1 pt-0.5 relative z-10">
                    {/* Position circle */}
                    <span className={`text-[8.5px] font-black px-1.5 rounded-sm shrink-0 border ${
                      player.isLegend ? 'bg-green-700/90 text-green-100 border-green-500/50' : 'bg-slate-800 text-slate-100 border-slate-700'
                    }`}>
                      {pos.role}
                    </span>
                  </div>

                  {/* Player avatar & overall rating overlap */}
                  <div className="relative flex-1 flex items-center justify-center pt-1">
                    <img 
                      src={player.photoUrl} 
                      alt=""
                      className="w-13 h-13 rounded-md object-cover relative z-0 border border-slate-700/40"
                      referrerPolicy="no-referrer"
                    />

                    {/* Interactive indicators layer */}
                    <div className="absolute top-0 right-0.5 flex flex-col gap-0.5 z-10">
                      {getPlayerExtras(player.id).yellowCards > 0 && (
                        <div className="flex gap-0.5">
                          {Array.from({ length: getPlayerExtras(player.id).yellowCards }).map((_, i) => (
                            <div key={i} className="w-1.5 h-2.5 bg-yellow-400 rounded-sm shadow-sm" />
                          ))}
                        </div>
                      )}
                      {getPlayerExtras(player.id).redCards > 0 && (
                        <div className="w-1.5 h-2.5 bg-red-600 rounded-sm shadow-sm animate-pulse" />
                      )}
                    </div>

                    {/* Injured cross overlay */}
                    {getPlayerExtras(player.id).status === 'injured' && (
                      <div className="absolute inset-0 bg-red-950/60 rounded-md flex items-center justify-center z-10">
                        <span className="bg-rose-600 text-white font-black text-[9px] px-1 rounded shadow border border-rose-400">INJ</span>
                      </div>
                    )}

                    {/* Substitute overlay */}
                    {getPlayerExtras(player.id).status === 'substitute' && (
                      <div className="absolute bottom-0 inset-x-0 bg-indigo-900/80 flex items-center justify-center z-10 py-0.5">
                        <span className="text-white font-mono font-black text-[7px] tracking-wide uppercase">SUB</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Remove Player Button - positioned absolutely on top-right of the card container */}
                <button 
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                  }}
                  onPointerMove={(e) => {
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleRemovePlayer(e, idx);
                  }} 
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 border border-red-600 rounded-full flex items-center justify-center text-white shadow-xl opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-all z-40 cursor-pointer pointer-events-auto hover:scale-110 active:scale-95"
                  title="Remove Squad Player from Position"
                >
                  <span className="text-[12px] font-black leading-none mb-0.5 pointer-events-none">×</span>
                </button>

                {/* Absolute naming label placed safely beneath card container */}
                <span className="block text-[10px] font-bold text-white bg-slate-955/90 px-1.5 py-0.5 rounded-md mt-1 shadow border border-slate-800 text-center tracking-wide overflow-hidden max-w-20 truncate">
                  {player.name.split(' ').slice(-1)[0]}
                </span>

              </motion.div>
            );
          })}

          {/* DRAGGABLE TACTICAL SOCCER BALL */}
          {showBall && (
            <div
              id="tactics-ball-element"
              style={{ top: `${ballPos.top}%`, left: `${ballPos.left}%` }}
              onPointerDown={(e) => handleElementPointerDown(e, 'ball')}
              onPointerUp={handleElementPointerUp}
              onPointerMove={handleElementPointerMove}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center shadow-xl cursor-grab active:cursor-grabbing z-30 transition-shadow hover:scale-110 select-none animate-bounce-short"
              title="Tactical Match Ball (Drag to plot plays or attacking runs!)"
            >
              <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-15">
                  <div className="border-r border-b border-black" />
                  <div className="border-l border-b border-black" />
                  <div className="border-r border-t border-black" />
                  <div className="border-l border-t border-black" />
                </div>
                <span className="text-[14px]">⚽</span>
              </div>
            </div>
          )}

          {/* DRAGGABLE DEFENSIVE WALL */}
          {showWall && (
            <div
              id="tactics-wall-element"
              style={{ top: `${wallPos.top}%`, left: `${wallPos.left}%` }}
              onPointerDown={(e) => handleElementPointerDown(e, 'wall')}
              onPointerUp={handleElementPointerUp}
              onPointerMove={handleElementPointerMove}
              className="absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 bg-red-650/95 border border-red-400 text-white rounded-lg flex items-center justify-center gap-1 shadow-2xl cursor-grab active:cursor-grabbing z-30 select-none hover:scale-105"
              title="Defensive Wall (Drag/place on pitch!)"
            >
              <div className="flex items-center gap-1 text-[9.5px] font-black tracking-widest font-mono text-white">
                <span>🛡️</span>
                <span>WALL</span>
                <div className="flex gap-0.5 ml-0.5">
                  <div className="w-1.5 h-2.5 bg-white/40 rounded-sm" />
                  <div className="w-1.5 h-2.5 bg-white/40 rounded-sm" />
                  <div className="w-1.5 h-2.5 bg-white/40 rounded-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Floating HUD bottom overlay details */}
          <div className="absolute bottom-4 left-4 p-2 bg-slate-950/80 border border-slate-800 rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Formation</span>
              {isCustomMode && (
                <span className="text-[8px] bg-indigo-600 text-white font-extrabold px-1 py-0.2 rounded font-mono uppercase tracking-wider scale-90">CUSTOM</span>
              )}
            </div>
            <p id="pitch-hud-val-formation" className="font-display font-black text-white text-lg leading-tight uppercase">{activeFormation}</p>
          </div>

          <div className="absolute bottom-4 right-4 p-2 bg-slate-950/80 border border-slate-800 rounded-lg text-right">
            <div className="flex items-center justify-end gap-1.5">
              {isCustomMode && (
                <span id="pitch-hud-val-mentality" className="text-[8.5px] text-indigo-400 font-bold uppercase tracking-widest">{customMentality}</span>
              )}
              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Active Tactic Style</span>
            </div>
            <p id="pitch-hud-val-playstyle" className="font-display font-black text-amber-400 text-sm leading-tight uppercase">{activePlaystyle}</p>
          </div>

        </div>

        {/* Removed Tactical board controls & details footer */}

      </div>


      {/* RIGHT SIDE FEATURED DETAIL CARD PANEL */}
      <div className="xl:col-span-3 space-y-5 flex flex-col relative z-10">

        {/* Coach's Playbook Toolkit */}
        <div className="bg-[#0f172a]/95 p-4 rounded-2xl border border-slate-800/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400">COACH'S TOOLSET</h4>
                <p className="text-[9px] text-slate-500 font-mono">Interactive Playbook Designer</p>
              </div>
            </div>
            {isDrawingMode && (
              <span className="text-[7.5px] bg-amber-450/15 text-amber-400 font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">DRAW ACTIVE</span>
            )}
          </div>

          {/* Draw & Brush Tools Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">✏️ Board Markings</span>
              <button 
                id="btn-coach-draw-toggle"
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md border transition-all ${
                  isDrawingMode 
                    ? 'bg-amber-400 text-slate-950 border-amber-400 font-black shadow-md shadow-amber-400/10' 
                    : 'bg-white/5 text-slate-400 hover:text-white border-slate-800/80'
                }`}
              >
                {isDrawingMode ? 'Drawing On' : 'Drawing Off'}
              </button>
            </div>

            {isDrawingMode && (
              <div id="drawing-brush-controls" className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 space-y-2.5">
                {/* Color presets and brush size selector */}
                <div className="flex items-center justify-between gap-2.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">Brush Color</span>
                  <div className="flex gap-1.5">
                    {[
                      { hex: '#fbbf24', label: 'Amber' },
                      { hex: '#ef4444', label: 'Red' },
                      { hex: '#38bdf8', label: 'Sky' },
                      { hex: '#ffffff', label: 'White' },
                      { hex: '#10b981', label: 'Lime' }
                    ].map((col) => (
                      <button
                        key={col.hex}
                        onClick={() => setBrushColor(col.hex)}
                        style={{ backgroundColor: col.hex }}
                        className={`w-4 h-4 rounded-full border transition-transform ${
                          brushColor === col.hex ? 'scale-125 border-cyan-400 ring-1 ring-cyan-500/30' : 'border-black/50 hover:scale-110'
                        }`}
                        title={col.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">Brush Size</span>
                  <div className="flex gap-1">
                    {[2, 3, 5].map((size) => (
                      <button
                        key={size}
                        onClick={() => setBrushWidth(size)}
                        className={`text-[8.5px] px-2 py-0.5 rounded font-mono font-bold transition-all ${
                          brushWidth === size ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-slate-100'
                        }`}
                      >
                        {size === 2 ? 'Thin' : size === 3 ? 'Mid' : 'Thick'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Path controls help indicators */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                id="btn-coach-draw-undo"
                disabled={paths.length === 0}
                onClick={handleUndoDrawing}
                className="text-[9.5px] font-bold text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-805 border border-slate-800/80 px-2 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                ↩️ Undo Line
              </button>
              <button
                id="btn-coach-draw-clear"
                disabled={paths.length === 0}
                onClick={handleClearDrawings}
                className="text-[9.5px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/10 border border-slate-800/80 px-2 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                title="Clear all drawn board lines"
              >
                🗑️ Clear Ink
              </button>
            </div>
          </div>

          {/* Tactical Game Elements Section */}
          <div className="border-t border-slate-800/60 pt-3 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">⚽ Accessories & Runs</span>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-coach-ball-toggle"
                onClick={() => setShowBall(!showBall)}
                className={`py-1.5 px-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                  showBall 
                    ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-slate-900/40 text-slate-400 border-slate-805'
                }`}
              >
                <span className="text-[10.5px] font-bold flex items-center gap-1">⚽ Ball Icon</span>
                <span className="text-[9px] font-bold uppercase">{showBall ? 'On' : 'Off'}</span>
              </button>

              <button
                id="btn-coach-wall-toggle"
                onClick={() => setShowWall(!showWall)}
                className={`py-1.5 px-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                  showWall 
                    ? 'bg-red-650/10 text-red-500 border-red-500/20' 
                    : 'bg-slate-900/40 text-slate-400 border-slate-805'
                }`}
              >
                <span className="text-[10.5px] font-bold flex items-center gap-1">🛡️ Def. Wall</span>
                <span className="text-[9px] font-bold uppercase">{showWall ? 'On' : 'Off'}</span>
              </button>
            </div>

            {/* Reset Drags Action */}
            <button
              id="btn-coach-reset-drag"
              onClick={handleResetPositions}
              className="w-full text-center text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850 px-3 py-2 rounded-xl transition-all border border-slate-800/80 hover:border-slate-700 block"
            >
              🔄 Reset Dragged Offsets
            </button>
            
            <p className="text-[8.5px] text-slate-500 italic text-center leading-normal">
              💡 Toggle <strong>Drawing On</strong> to paint runs, or <strong>Drawing Off</strong> to drag players, the ball & the defensive wall!
            </p>
          </div>
        </div>

        {/* Featured Player detail display (eFootball card look) */}
        <div className="bg-[#0f172a]/95 p-4 rounded-2xl border border-slate-850 shadow-md flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">POSITION DETAIL VIEW</span>
              <div className="flex bg-slate-800 text-slate-300 p-0.5 rounded-lg text-[10px] font-bold">
                <button 
                  onClick={() => setRightPanelTab('Basic')} 
                  className={`px-2.5 py-1 rounded-md transition-all ${rightPanelTab === 'Basic' ? 'bg-indigo-600 text-white font-extrabold' : ''}`}
                >
                  Basic
                </button>
                <button 
                  onClick={() => setRightPanelTab('Status')} 
                  className={`px-2.5 py-1 rounded-md transition-all ${rightPanelTab === 'Status' ? 'bg-indigo-600 text-white font-extrabold' : ''}`}
                >
                  Status
                </button>
              </div>
            </div>

            {/* Render selected active details box */}
            {activeSelectedPlayer ? (
              <div className="mt-4 space-y-4">
                
                {/* Visual featured badge centered */}
                <div className="flex justify-center">
                  <div className="relative w-40 h-50 rounded-2xl bg-gradient-to-b from-amber-300 via-yellow-450 to-orange-850 p-0.5 shadow-2xl overflow-hidden border border-amber-200/40">
                    <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 mix-blend-multiply" />
                    
                    <div className="absolute top-2 left-2 flex items-center justify-between right-2 z-10">
                      <span className="bg-slate-950 border border-slate-850 text-amber-400 font-extrabold text-[10px] px-2 py-0.5 rounded-lg font-mono">
                        {fieldPositions[selectedSlotIndex]?.role || activeSelectedPlayer.position}
                      </span>
                      <span className="bg-amber-400 text-slate-950 font-black font-mono text-[9.5px] px-1.5 py-0.5 rounded shadow-sm" title="Jersey Number">
                        #{activeSelectedPlayer.number || '10'}
                      </span>
                    </div>

                    <img 
                      src={activeSelectedPlayer.photoUrl} 
                      alt={activeSelectedPlayer.name} 
                      className="w-full h-full object-cover shrink-0 relative z-0"
                      referrerPolicy="no-referrer"
                    />

                    {/* Bottom stats overlay bar */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-2 pt-6 text-center z-10">
                      <h4 className="font-display font-black text-[12px] text-white uppercase tracking-wider truncate">
                        {activeSelectedPlayer.name}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Sub panels Tab Swapper */}
                {rightPanelTab === 'Basic' ? (
                  <div className="space-y-4 py-1">
                    <div className="grid grid-cols-2 gap-x-3.5 gap-y-2.5 text-xs text-slate-350 bg-slate-950/50 p-3 rounded-xl border border-slate-900/60 font-mono">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Jersey No</span>
                        <strong className="text-slate-200 mt-0.5 text-[10.5px]">#{activeSelectedPlayer.number ?? 'N/A'}</strong>
                      </div>
                      <div className="flex flex-col font-sans">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold">Registration</span>
                        <strong className="text-emerald-400 mt-0.5 text-[10.5px] font-bold">{activeSelectedPlayer.registrationStatus || 'Active'}</strong>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Matches Slot</span>
                        <strong className="text-slate-200 mt-0.5 text-[10.5px]">{activeSelectedPlayer.gamesPlayed ?? 0} Pl.</strong>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Goals & Asts</span>
                        <strong className="text-amber-400 mt-0.5 text-[10.5px]">{activeSelectedPlayer.points ?? 0}G / {activeSelectedPlayer.assists ?? 0}A</strong>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Discipline</span>
                        <strong className="text-slate-200 mt-0.5 text-[10.5px] flex items-center gap-1">
                          {getPlayerExtras(activeSelectedPlayer.id).yellowCards > 0 ? (
                            <span className="text-amber-400">{getPlayerExtras(activeSelectedPlayer.id).yellowCards} 🟨</span>
                          ) : <span className="text-slate-600">0 🟨</span>}
                          <span className="text-slate-600">·</span>
                          {getPlayerExtras(activeSelectedPlayer.id).redCards > 0 ? (
                            <span className="text-red-400">{getPlayerExtras(activeSelectedPlayer.id).redCards} 🟥</span>
                          ) : <span className="text-slate-600">0 🟥</span>}
                        </strong>
                      </div>
                    </div>

                    {/* Skill Rating Bar Breakdown */}
                    {activeSelectedPlayer.attributes && (
                      <div className="space-y-2.5 bg-slate-950/30 p-3 rounded-xl border border-slate-900/50">
                        <span className="text-[9px] font-black tracking-widest text-[#fbbf24] uppercase block">ATHLETE SKILL BREAKDOWN ({activeSelectedPlayer.rating} OVR)</span>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[10px]">
                          {[
                            { name: 'Speed', val: activeSelectedPlayer.attributes.speed, color: 'bg-amber-400' },
                            { name: 'Shooting', val: activeSelectedPlayer.attributes.shooting, color: 'bg-rose-500' },
                            { name: 'Passing', val: activeSelectedPlayer.attributes.passing, color: 'bg-sky-400' },
                            { name: 'Dribbling', val: activeSelectedPlayer.attributes.dribbling, color: 'bg-emerald-400' },
                            { name: 'Defending', val: activeSelectedPlayer.attributes.defending, color: 'bg-indigo-400' },
                            { name: 'Physicality', val: activeSelectedPlayer.attributes.physicalness, color: 'bg-fuchsia-400' }
                          ].map(attr => (
                            <div key={attr.name} className="space-y-1">
                              <div className="flex justify-between font-mono text-[9px] leading-none">
                                <span className="text-slate-400">{attr.name}</span>
                                <span className="text-slate-200 font-bold">{attr.val}</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                                <div className={`h-full ${attr.color}`} style={{ width: `${attr.val}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {activeSelectedPlayer.bio && (
                      <div className="text-[10px] text-slate-500 border-t border-slate-850 pt-2 font-sans italic text-center leading-normal">
                        "{activeSelectedPlayer.bio}"
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 text-xs mt-2">
                    
                    {/* Athlete Status Option */}
                    <div>
                      <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block mb-1.5">Roster Status</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['starting', 'substitute', 'injured'] as const).map((st) => {
                          const currentExtra = getPlayerExtras(activeSelectedPlayer.id);
                          const isActive = currentExtra.status === st;
                          
                          let bgClass = "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750";
                          if (isActive) {
                            if (st === 'starting') bgClass = "bg-emerald-500 border-emerald-450 text-slate-950 font-black";
                            if (st === 'substitute') bgClass = "bg-indigo-600 border-indigo-500 text-white font-black";
                            if (st === 'injured') bgClass = "bg-rose-600 border-rose-500 text-white font-black";
                          }

                          return (
                            <button
                              id={`status-btn-${st}`}
                              key={st}
                              onClick={() => updatePlayerExtras(activeSelectedPlayer.id, { status: st })}
                              className={`py-1.5 px-1 rounded-lg border text-[10px] transition-all capitalize text-center font-bold ${bgClass}`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Yellow Cards Controls */}
                    <div className="border-t border-slate-800/80 pt-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">Yellow Cards</span>
                        <div className="flex gap-1">
                          {Array.from({ length: getPlayerExtras(activeSelectedPlayer.id).yellowCards }).map((_, i) => (
                            <div key={i} className="w-2.5 h-3.5 bg-yellow-400 rounded-sm border border-yellow-500/30 shadow-sm" />
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          id="btn-remove-yellow"
                          onClick={() => {
                            const current = getPlayerExtras(activeSelectedPlayer.id).yellowCards;
                            updatePlayerExtras(activeSelectedPlayer.id, { yellowCards: Math.max(0, current - 1) });
                          }}
                          className="flex-1 py-1 px-2 bg-slate-800 text-slate-350 border border-slate-700 rounded-lg hover:bg-slate-750 text-[10px] font-bold"
                        >
                          Clear Card
                        </button>
                        <button
                          id="btn-add-yellow"
                          onClick={() => {
                            const current = getPlayerExtras(activeSelectedPlayer.id).yellowCards;
                            updatePlayerExtras(activeSelectedPlayer.id, { yellowCards: Math.min(2, current + 1) });
                          }}
                          className="flex-1 py-1 px-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg border border-yellow-600/30 text-[10px]"
                        >
                          + Add Yellow
                        </button>
                      </div>
                    </div>

                    {/* Red Cards Controls */}
                    <div className="border-t border-slate-800/80 pt-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">Red Card</span>
                        {getPlayerExtras(activeSelectedPlayer.id).redCards > 0 && (
                          <div className="w-2.5 h-3.5 bg-red-650 rounded-sm border border-red-700/35 shadow-sm animate-pulse" />
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          id="btn-toggle-red"
                          onClick={() => {
                            const current = getPlayerExtras(activeSelectedPlayer.id).redCards;
                            updatePlayerExtras(activeSelectedPlayer.id, { redCards: current > 0 ? 0 : 1 });
                          }}
                          className={`w-full py-1.5 px-2 text-[10px] font-black rounded-lg border transition-all text-center ${
                            getPlayerExtras(activeSelectedPlayer.id).redCards > 0
                              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-700 font-extrabold'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                          }`}
                        >
                          {getPlayerExtras(activeSelectedPlayer.id).redCards > 0 ? '🔴 Dismiss Red Card' : '🔴 Sentence Red Card'}
                        </button>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            ) : (
              <div className="mt-4 py-8 px-4 bg-slate-950/40 rounded-2xl border border-slate-900/60 border-dashed text-center space-y-3.5">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-xl mx-auto">
                  👤
                </div>
                <div className="space-y-1">
                  <h4 className="text-[11px] font-black uppercase text-slate-300 tracking-wider font-mono">Empty Slot ({fieldPositions[selectedSlotIndex]?.role || 'N/A'})</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-[210px] mx-auto">
                    No active athlete is currently placed on this tactical field slot. Assign one using the dropdown menu below!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Selector Dropdown to Swap Player into this slot */}
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <label className="text-[10px] font-black text-slate-400 tracking-wider block uppercase mb-1.5 font-mono">
              {activeSelectedPlayer ? '🔄 Swap Athlete / Re-assign Position' : '👥 Assign Athlete to Position'}
            </label>
            <div className="relative">
              <select
                id="select-squad-player"
                value={activeSelectedPlayer?.id || ''}
                onChange={(e) => {
                  const found = allEligiblePool.find(p => p.id === e.target.value);
                  if (found) {
                    handleAssignPlayer(found);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-amber-300 font-bold focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
              >
                <option value="" disabled className="text-slate-500">
                  {activeSelectedPlayer ? '-- Keep Current Athlete --' : '-- Choose Athlete to Place --'}
                </option>
                {allEligiblePool.length > 0 && (
                  <optgroup label="SQUAD ATHELETES POOL" className="bg-[#0f172a] text-slate-300">
                    {allEligiblePool.map(p => {
                      const isAssignedElsewhere = (Object.values(lineup) as (TacticsPlayer | null | undefined)[]).some(lp => lp?.id === p.id && lp?.id !== activeSelectedPlayer?.id);
                      return (
                        <option key={p.id} value={p.id} className="text-slate-100 font-bold">
                          👥 {p.name} ({p.position} - Rating: {p.rating}) {isAssignedElsewhere ? '⚠️ [On Pitch]' : ''}
                        </option>
                      );
                    })}
                  </optgroup>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SQUAD SETTING DIRECTORY CONFIG PANEL */}
      <AnimatePresence>
        {activeTab === 'Tactics' && (
          <motion.div 
            id="tactics-panel-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="xl:col-span-12 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mt-4 text-xs select-none relative"
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
              <h4 className="font-display font-black text-white flex items-center gap-2 uppercase tracking-wide">
                <BarChart2 className="text-amber-400 shrink-0" size={16} /> Playstyle Tactics & Formations
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Control Desk</span>
            </div>

            {/* Match Format Selection */}
            <div className="mb-6 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="text-[10px] font-black tracking-widest text-slate-300 uppercase block mb-1">
                    Match Format
                  </label>
                  <p className="text-[10px] text-slate-500 max-w-sm">
                    Select the game type to automatically adjust squad size and available tactical templates.
                  </p>
                </div>
                <select
                  value={matchFormat}
                  onChange={(e) => setMatchFormat(e.target.value as MatchFormat)}
                  className="w-full sm:w-auto min-w-[200px] bg-slate-900 border border-slate-700 text-slate-100 font-bold px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer shadow-inner"
                >
                  <option value="11-a-side">🏟️ 11-a-side (Full Squad)</option>
                  <option value="7-a-side">⚡ 7-a-side (Half Pitch)</option>
                  <option value="5-a-side">🔥 5-a-side (Futsal / Cage)</option>
                </select>
              </div>
            </div>

            {/* Custom Mode Toggle with elegant border glow */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-indigo-500/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest animate-pulse">
                    COACH ENGINE
                  </span>
                  <span className="text-slate-300 font-bold text-xs">Custom Strategy Mode</span>
                </div>
                <p className="text-slate-400 text-[11px] font-sans">
                  Bypass default templates and manually construct custom team layouts, playing styles, defensive anchors, and coach manuals.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black tracking-wider leading-none ${isCustomMode ? 'text-amber-400' : 'text-slate-500'}`}>
                  {isCustomMode ? "CUSTOM STRATEGY ACTIVE" : "DEFAULT TEMPLATES ONLY"}
                </span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="toggle-custom-strategy-mode"
                    checked={isCustomMode}
                    onChange={(e) => setIsCustomMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            {isCustomMode ? (
              <motion.div 
                id="custom-strategy-blueprint-editor"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 mb-5"
              >
                {/* Custom Formation Select */}
                <div className="lg:col-span-4 space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-300 uppercase block">
                    Custom Team Formation
                  </label>
                  <select
                    id="select-custom-formation"
                    value={customFormationInput}
                    onChange={(e) => setCustomFormationInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 text-amber-300 font-bold px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none cursor-pointer"
                  >
                    {MATCH_FORMAT_CONFIG[matchFormat].formations.map((fmt) => (
                      <option key={fmt} value={fmt} className="bg-[#0f172a] text-slate-100 font-bold">
                        {fmt}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    {matchFormat === '11-a-side' ? 'Select from classic 11-a-side tactical formations.' :
                     matchFormat === '7-a-side' ? 'Select from standard 7-a-side half-pitch formations.' :
                     'Select from standard 5-a-side futsal / cage formations.'}
                  </p>
                </div>

                {/* Custom Tactic Playstyle */}
                <div className="lg:col-span-4 space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-300 uppercase block">
                    Custom Playstyle Directive
                  </label>
                  <input
                    type="text"
                    id="input-custom-playstyle"
                    value={customPlaystyleInput}
                    onChange={(e) => setCustomPlaystyleInput(e.target.value)}
                    placeholder="Direct Attacking Tiki-Taka"
                    className="w-full bg-slate-900 border border-slate-850 text-indigo-300 font-bold px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Designate custom transitional playstyles for counter attacks or localized retention focus.
                  </p>
                </div>

                {/* Custom Defensive Playstyle */}
                <div className="lg:col-span-4 space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-300 uppercase block">
                    Custom Defensive Anchor
                  </label>
                  <input
                    type="text"
                    id="input-custom-defensive"
                    value={customDefensiveInput}
                    onChange={(e) => setCustomDefensiveInput(e.target.value)}
                    placeholder="Aggressive Wing Press"
                    className="w-full bg-slate-900 border border-slate-850 text-emerald-400 font-bold px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Dictate custom pressing models, offside triggers, or backline depth constraints.
                  </p>
                </div>

                {/* Strategy Mentalities & Detailed commentary text notes */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-5 border-t border-slate-800/80 pt-4 mt-1">
                  
                  {/* Tactic Mentality */}
                  <div className="md:col-span-4 space-y-2">
                    <label className="text-[10px] font-black tracking-widest text-slate-300 uppercase block">
                      Tactical Mentality Setting
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <select
                        id="select-custom-mentality"
                        value={customMentality}
                        onChange={(e) => setCustomMentality(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 text-slate-100 font-bold px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="Ultra Defensive">🛡️ Ultra Defensive (Park the Bus)</option>
                        <option value="Defensive">⚔️ Defensive (Cautious Build Up)</option>
                        <option value="Balanced">⚖️ Balanced (Fluid Interchange)</option>
                        <option value="Attacking">🔥 Attacking (Overload Flanks)</option>
                        <option value="Ultra Attacking">⚡ Ultra Attacking (All Out Rush)</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Adjusts baseline squad aggression indices and transition speeds overall.
                    </p>
                  </div>

                  {/* Tactical notes */}
                  <div className="md:col-span-8 space-y-2">
                    <label className="text-[10px] font-black tracking-widest text-slate-300 uppercase block">
                      Coach Directives & Game Plan Commentary
                    </label>
                    <textarea
                      id="textarea-custom-strategy-notes"
                      value={customStrategyNotes}
                      onChange={(e) => setCustomStrategyNotes(e.target.value)}
                      rows={3}
                      placeholder="Input comprehensive instructions, marking guides, setup requirements..."
                      className="w-full bg-slate-900 border border-slate-850 text-slate-200 font-medium px-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Change Team Formation</label>
                  <div className="grid grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {MATCH_FORMAT_CONFIG[matchFormat].formations.map((fmt) => (
                      <button
                        id={`btn-formation-${fmt}`}
                        key={fmt}
                        onClick={() => setFormation(fmt)}
                        className={`py-2 px-2 rounded-lg font-semibold border transition-all text-center text-[10px] ${
                          formation === fmt 
                            ? 'bg-amber-400 border-amber-400 text-slate-950 font-black' 
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">Adjusting the template shifts designated positions dynamically over the digital terrain.</p>
                </div>

                <div>
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Change Tactic Playstyle</label>
                  <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {playstyles.map((style) => (
                      <button
                        id={`btn-playstyle-${style.replaceAll(' ', '-')}`}
                        key={style}
                        onClick={() => setPlaystyle(style)}
                        className={`py-2 px-3 rounded-lg font-semibold border transition-all text-center text-xs truncate ${
                          playstyle === style 
                            ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-sm' 
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">Select strategy to dictate how players coordinate in transitions on the playing field.</p>
                </div>

                <div>
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Defensive Play Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['High Press', 'Half Press', 'Man to Man', 'Low Block'].map((defStyle) => (
                      <button
                        id={`btn-defstyle-${defStyle.replaceAll(' ', '-')}`}
                        key={defStyle}
                        onClick={() => setDefensiveStyle(defStyle)}
                        className={`py-2 px-3 rounded-lg font-semibold border transition-all text-center ${
                          defensiveStyle === defStyle 
                            ? 'bg-emerald-600 border-emerald-500 text-white font-bold shadow-sm' 
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {defStyle}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">Dictates how high up the field and in what pattern your squad coordinates when defending.</p>
                </div>
              </div>
            )}

            {/* Set Piece Roles */}
            <div className="mt-6 border-t border-slate-800/80 pt-5">
              <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-3">Set Piece & Leadership Assignments</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Captaincy Card */}
                <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">© Captain</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Leads motivational boost.</p>
                  </div>
                  <select
                    id="select-captain"
                    value={captainId}
                    onChange={(e) => setCaptainId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-[11px] text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                  >
                    <option value="">-- Select Captain --</option>
                    {allEligiblePool.map((player) => (
                      <option key={player.id} value={player.id} className="bg-[#0f172a] text-white font-bold">{player.name}</option>
                    ))}
                  </select>
                </div>

                {/* Free Kick Taker Card */}
                <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">🎯 Free Kicks</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Takes precision direct kicks.</p>
                  </div>
                  <select
                    id="select-free-kick"
                    value={freeKickTakerId}
                    onChange={(e) => setFreeKickTakerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-[11px] text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                  >
                    <option value="">-- Select Free Kicker --</option>
                    {allEligiblePool.map((player) => (
                      <option key={player.id} value={player.id} className="bg-[#0f172a] text-white font-bold">{player.name}</option>
                    ))}
                  </select>
                </div>

                {/* Penalty Taker Card */}
                <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">🥅 Penalty Kicker</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Assigned for highest composure.</p>
                  </div>
                  <select
                    id="select-penalties"
                    value={penaltyTakerId}
                    onChange={(e) => setPenaltyTakerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-[11px] text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                  >
                    <option value="">-- Select Penalty Kicker --</option>
                    {allEligiblePool.map((player) => (
                      <option key={player.id} value={player.id} className="bg-[#0f172a] text-white font-bold">{player.name}</option>
                    ))}
                  </select>
                </div>

                {/* Corner Taker Card */}
                <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider block">🚩 Corner Kicks</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Crosses from left and right flags.</p>
                  </div>
                  <select
                    id="select-corners"
                    value={cornerTakerId}
                    onChange={(e) => setCornerTakerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-[11px] text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                  >
                    <option value="">-- Select Corner Kicker --</option>
                    {allEligiblePool.map((player) => (
                      <option key={player.id} value={player.id} className="bg-[#0f172a] text-white font-bold">{player.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Start list of active players for team tab */}
        {activeTab === 'Team' && (
          <motion.div 
            id="team-list-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="xl:col-span-12 bg-[#0f172a] border border-slate-800 rounded-2xl p-5 mt-4"
          >
            <h4 className="font-display font-black text-white mb-3 text-xs uppercase tracking-wider">Current Starting {MATCH_FORMAT_CONFIG[matchFormat].size} List</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: MATCH_FORMAT_CONFIG[matchFormat].size }).map((_, idx) => {
                const player = lineup[idx];
                if (!player) return null;
                return (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedSlotIndex(idx)}
                    className={`p-3 bg-slate-900 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                      selectedSlotIndex === idx ? 'border-amber-400 bg-amber-500/5' : 'border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={player.photoUrl} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <h5 className="font-bold text-xs text-white truncate max-w-[120px]">{player.name}</h5>
                        <span className="text-[10px] text-slate-400">{fieldPositions[idx]?.role || player.position}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Subscribers / Substitutes menu */}
        {activeTab === 'Substitutes' && (
          <motion.div 
            id="substitutes-list-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="xl:col-span-12 bg-[#0f172a] border border-slate-800 rounded-2xl p-5 mt-4"
          >
            <h4 className="font-display font-black text-white mb-3 text-xs uppercase tracking-wider">Available Substitutes (Not in main {MATCH_FORMAT_CONFIG[matchFormat].size})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {substitutes.map((player) => (
                <div 
                  key={player.id} 
                  onClick={() => handleAssignPlayer(player)}
                  className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <img src={player.photoUrl} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <h5 className="font-bold text-xs text-white truncate max-w-[120px]">{player.name}</h5>
                      <span className="text-[10px] text-slate-400">{player.position}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-indigo-400 font-bold">Swap →</span>
                  </div>
                </div>
              ))}
              {substitutes.length === 0 && (
                <p className="col-span-4 text-center text-xs text-slate-500 py-6">All registered club teammates are placed in the starting alignment, or the roster is empty.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Reserves menu with active selection to put anywhere */}
        {activeTab === 'Reserves' && (
          <motion.div 
            id="reserves-list-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="xl:col-span-12 bg-[#0f172a] border border-slate-800 rounded-2xl p-5 mt-4"
          >
            <h4 className="font-display font-black text-white mb-3 text-xs uppercase tracking-wider">All Reservable Pool ({allEligiblePool.length} Total Athletes)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {allEligiblePool.map((player) => (
                <div 
                  key={player.id} 
                  onClick={() => handleAssignPlayer(player)}
                  className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <img src={player.photoUrl} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <h5 className="font-bold text-xs text-white tracking-wide truncate max-w-[120px]">{player.name}</h5>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest">{player.isLegend ? 'Legend' : 'Teammate'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PERSISTENT QUICK NOTES PANEL */}
      <div id="tactics-quick-notes-panel" className="xl:col-span-12 bg-[#0f172a] border border-slate-800 rounded-2xl p-6 mt-6 select-none relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/85 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/15 text-indigo-400 rounded-xl border border-indigo-500/20">
              <BookOpen size={18} />
            </div>
            <div>
              <h4 id="quick-notes-title" className="font-display font-black text-sm text-white uppercase tracking-wide flex items-center gap-2">
                Tactics Board Quick Notes & Playbooks
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Save short, persistent reminders about specific team formations, set-piece triggers, and general player instructions.
              </p>
            </div>
          </div>
          
          {/* Quick Note Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {['All', 'Formation', 'Set Pieces', 'Strategy', 'General'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setNotesFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                  notesFilter === cat 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT SIDE: CREATOR FORM */}
          <form onSubmit={handleAddNote} className="lg:col-span-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between gap-3.5">
            <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase block">
              Create New Reminder
            </span>
            
            <div className="space-y-3">
              <div>
                <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near-Post Header Routine"
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-650 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">
                  Category
                </label>
                <select
                  value={noteCategory}
                  onChange={e => setNoteCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Strategy">🧠 Strategy</option>
                  <option value="Formation">📐 Formation</option>
                  <option value="Set Pieces">🚩 Set Pieces</option>
                  <option value="General">📝 General</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">
                  Note Text / Instructions
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Write clear play instructions or defensive roles..."
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-650 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Plus size={13} /> Include in Playbook
            </button>
          </form>

          {/* RIGHT SIDE: NOTES CONTAINER */}
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickNotes
                .filter(note => notesFilter === 'All' || note.category === notesFilter)
                .map(note => {
                  const isEditing = editingNoteId === note.id;
                  
                  // Category badges style helper
                  const catStyle = 
                    note.category === 'Formation' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                    note.category === 'Set Pieces' ? 'text-amber-400 bg-amber-500/10 border-amber-500/15' :
                    note.category === 'Strategy' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/15' :
                    'text-slate-300 bg-slate-800 border-slate-700';

                  return (
                    <div 
                      key={note.id} 
                      className={`p-4 bg-slate-900 border rounded-xl flex flex-col justify-between gap-3.5 transition-all ${
                        isEditing ? 'border-amber-400 shadow-sm shadow-amber-400/5' : 'border-slate-800 hover:border-slate-750'
                      }`}
                    >
                      {isEditing ? (
                        /* Editing panel inside the note template */
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono font-bold tracking-tight">Edit Mode</span>
                            <select
                              value={editingNoteCategory}
                              onChange={e => setEditingNoteCategory(e.target.value as any)}
                              className="bg-slate-950 text-[10px] text-slate-300 border border-slate-800 rounded px-1.5 py-0.5"
                            >
                              <option value="Strategy">Strategy</option>
                              <option value="Formation">Formation</option>
                              <option value="Set Pieces">Set Pieces</option>
                              <option value="General">General</option>
                            </select>
                          </div>
                          <input
                            type="text"
                            value={editingNoteTitle}
                            onChange={e => setEditingNoteTitle(e.target.value)}
                            className="w-full bg-slate-955 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs font-bold"
                          />
                          <textarea
                            rows={3}
                            value={editingNoteContent}
                            onChange={e => setEditingNoteContent(e.target.value)}
                            className="w-full bg-slate-955 border border-slate-800 text-slate-300 rounded px-2 py-1 text-xs font-medium resize-none leading-relaxed"
                          />
                        </div>
                      ) : (
                        /* Standard display note */
                        <div>
                          <div className="flex items-center justify-between gap-2.5 mb-1.5">
                            <span className={`text-[9.5px] font-black uppercase tracking-widest px-1.5 py-0.5 border rounded-md ${catStyle}`}>
                              {note.category || 'General'}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">
                              {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Active'}
                            </span>
                          </div>
                          
                          <h5 className="font-bold text-xs text-white leading-snug">
                            {note.title}
                          </h5>
                          <p className="text-[11px] text-slate-305 leading-relaxed mt-1.5 break-words italic">
                            "{note.content}"
                          </p>
                        </div>
                      )}

                      {/* Small action footer row */}
                      <div className="flex items-center justify-end gap-2 border-t border-slate-800/65 pt-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveEditNote(note.id)}
                              className="text-[10px] font-black bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-2.5 py-1 rounded flex items-center gap-1 transition-all"
                            >
                              <Check size={11} /> Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNoteId(null)}
                              className="text-[10px] font-bold bg-slate-850 hover:bg-slate-800 text-slate-400 px-2.5 py-1 rounded transition-all"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEditNote(note)}
                              className="text-[10px] font-bold text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                            >
                              <Edit size={11} /> Edit
                            </button>
                            <span className="text-slate-800 text-[10px]">|</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-[10px] font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
                            >
                              <Trash2 size={11} /> Delete
                            </button>
                          </>
                        )}
                      </div>

                    </div>
                  );
                })}

              {quickNotes.filter(note => notesFilter === 'All' || note.category === notesFilter).length === 0 && (
                <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-slate-800 rounded-xl">
                  <span className="text-slate-500 text-sm">📕</span>
                  <p className="text-xs text-slate-400 font-medium">No playbook reminders match the "{notesFilter}" filter.</p>
                  <p className="text-[10px] text-slate-505">Create a new key note on the left to populate your layout!</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
