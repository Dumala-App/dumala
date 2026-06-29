import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Player, StaffMember } from '../types';
import { STAFF_PLACEHOLDER } from '../playerPlaceholders';
import { Shield, Crown, Star, Flame, Target, Trophy, Zap, Search, RefreshCw, UserCheck, Play, Save, ChevronRight, HelpCircle, User, Info, BarChart2, Edit, Trash2, Plus, Check, Filter, Tag, BookOpen, Maximize2, Minimize2, ClipboardList, Users, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  draggedPositionsSchema,
  drawingPathsSchema,
  matchFormatSchema,
  playerExtrasSchema,
  stringArraySchema,
  stringSchema,
  tacticsLineupSchema,
  tacticsNotesSchema
} from '../persistence/schemas';
import {
  readBooleanStorage,
  readJsonStorage,
  readStringStorage,
  removeStorage,
  STORAGE_KEYS,
  writeBooleanStorage,
  writeJsonStorage,
  writeStringStorage
} from '../persistence/storage';
import {
  buildPositionAwareLineup,
  type TacticsLineup,
  type TacticsPlayer
} from '../tactics/lineup';
import {
  getDefaultFormation,
  isFormationValidForFormat,
  MATCH_FORMAT_CONFIG,
  type MatchFormat
} from '../tactics/formations';
import { recommendMatchupStrategy } from '../tactics/recommendations';
import { ATTACK_STRATEGY_CARDS, DEFENSE_STRATEGY_CARDS, type TacticalStrategyCard } from '../tactics/strategyLibrary';
import { CoachKnowledgeBase } from './CoachKnowledgeBase';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { Textarea } from './ui/textarea';
import { cn } from '../lib/utils';

export { CoachKnowledgeBase as TacticsKnowledgeBase } from './CoachKnowledgeBase';

type PlayerStatus = 'starting' | 'substitute' | 'injured';
type PlayerStatusExtras = Record<string, {
  status: PlayerStatus;
  yellowCards: number;
  redCards: number;
}>;
type TacticsNoteCategory = 'Formation' | 'Set Pieces' | 'Strategy' | 'General';
type TacticsNote = {
  id: string;
  title: string;
  content: string;
  category: TacticsNoteCategory;
  createdAt: string;
};
type DraggedPositions = Record<number, { left: number; top: number }>;
type DrawingPoint = [number, number];
type DrawingPath = {
  color: string;
  width: number;
  points: DrawingPoint[];
};
type TacticsWorkspaceSection = 'board' | 'library';
type TacticsBoardPanel = 'squad' | 'tactics' | 'tools' | 'notes';

const TACTICS_NOTE_CATEGORIES: readonly TacticsNoteCategory[] = ['Formation', 'Set Pieces', 'Strategy', 'General'];
const EMPTY_SELECT_VALUE = '__none__';

const parseTacticsNoteCategory = (value: string): TacticsNoteCategory => (
  TACTICS_NOTE_CATEGORIES.includes(value as TacticsNoteCategory) ? value as TacticsNoteCategory : 'General'
);

interface TacticsViewProps {
  players: Player[];
  staff: StaffMember[];
  teamCoach: string;
  teamName?: string;
  teamLogoUrl?: string;
  onUpdatePlayer?: (updated: Player) => void;
}

export default function TacticsView({ players, staff, teamCoach, teamName, teamLogoUrl, onUpdatePlayer }: TacticsViewProps) {
  const [matchFormat, setMatchFormat] = useState<MatchFormat>(() => {
    return readStringStorage(STORAGE_KEYS.matchFormat, matchFormatSchema, '11-a-side', 'Tactics match format');
  });
  const [formation, setFormation] = useState<string>(() => readStringStorage(STORAGE_KEYS.formation, stringSchema, '4-1-2-3', 'Tactics formation'));
  const [opponentFormation, setOpponentFormation] = useState<string>(() => readStringStorage(STORAGE_KEYS.opponentFormation, stringSchema, getDefaultFormation('11-a-side'), 'Opponent formation'));
  const [playstyle, setPlaystyle] = useState<string>(() => readStringStorage(STORAGE_KEYS.playstyle, stringSchema, 'Quick Counter', 'Tactics playstyle'));
  const [activeTab, setActiveTab] = useState<'Tactics' | 'Team' | 'Substitutes' | 'Reserves'>('Tactics');
  const [activeWorkspaceSection, setActiveWorkspaceSection] = useState<TacticsWorkspaceSection>('board');
  const [activeBoardPanel, setActiveBoardPanel] = useState<TacticsBoardPanel>('squad');
  const [isBoardFullscreen, setIsBoardFullscreen] = useState<boolean>(false);
  
  // Custom Strategy Mode States
  const [isCustomMode, setIsCustomMode] = useState<boolean>(() => {
    return readBooleanStorage(STORAGE_KEYS.isCustomStrategy, false, 'Tactics strategy');
  });
  const [customPlaystyleInput, setCustomPlaystyleInput] = useState<string>(() => {
    return readStringStorage(STORAGE_KEYS.customPlaystyle, stringSchema, 'Direct Attacking Tiki-Taka', 'Tactics strategy');
  });
  const [customDefensiveInput, setCustomDefensiveInput] = useState<string>(() => {
    return readStringStorage(STORAGE_KEYS.customDefensiveStyle, stringSchema, 'Aggressive Wing Press', 'Tactics strategy');
  });
  const [customMentality, setCustomMentality] = useState<string>(() => {
    return readStringStorage(STORAGE_KEYS.customMentality, stringSchema, 'Balanced', 'Tactics strategy');
  });
  const [customStrategyNotes, setCustomStrategyNotes] = useState<string>(() => {
    return readStringStorage(STORAGE_KEYS.customStrategyNotes, stringSchema, 'Focus on rapid mid-block transitional overload. Fullbacks overlap actively while DMF covers the backline.', 'Tactics strategy');
  });
  
  const [isEditingCoach, setIsEditingCoach] = useState<boolean>(false);
  const rosterCoach = useMemo(() => {
    const normalizedTeamCoach = teamCoach.trim().toLowerCase();
    return staff.find(member => member.name.trim().toLowerCase() === normalizedTeamCoach)
      || staff.find(member => member.role === 'Manager / Coach')
      || staff.find(member => member.role.toLowerCase().includes('manager'))
      || staff.find(member => member.role.toLowerCase().includes('coach'));
  }, [staff, teamCoach]);
  const coachName = rosterCoach?.name || teamCoach || 'Team Manager';
  const coachPhoto = rosterCoach?.photoUrl || STAFF_PLACEHOLDER;
  const [coachLevel, setCoachLevel] = useState<string>(() => readStringStorage(STORAGE_KEYS.coachLevel, stringSchema, 'Expert ★★★★★', 'Tactics coach details'));
  const [isTeamLogoBroken, setIsTeamLogoBroken] = useState<boolean>(false);

  useEffect(() => {
    setIsTeamLogoBroken(false);
  }, [teamLogoUrl]);

  useEffect(() => {
    if (!isBoardFullscreen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsBoardFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isBoardFullscreen]);

  const renderTeamLogo = (logoSize: number, className = '') => {
    if (!teamLogoUrl || isTeamLogoBroken) {
      return <Shield size={logoSize} className={className} />;
    }

    if (teamLogoUrl.startsWith('preset:')) {
      const key = teamLogoUrl.replace('preset:', '');
      switch (key) {
        case 'shield': return <Shield size={logoSize} className={className} />;
        case 'crown': return <Crown size={logoSize} className={className} />;
        case 'star': return <Star size={logoSize} className={className} />;
        case 'flame': return <Flame size={logoSize} className={className} />;
        case 'target': return <Target size={logoSize} className={className} />;
        case 'trophy': return <Trophy size={logoSize} className={className} />;
        default: return <Shield size={logoSize} className={className} />;
      }
    }

    return (
      <img
        src={teamLogoUrl}
        alt="Team logo"
        className={`object-contain ${className}`}
        style={{ width: logoSize, height: logoSize }}
        onError={() => setIsTeamLogoBroken(true)}
        referrerPolicy="no-referrer"
      />
    );
  };

  const [playstyles, setPlaystyles] = useState<string[]>(() => {
    return readJsonStorage(
      STORAGE_KEYS.customPlaystyles,
      stringArraySchema,
      ATTACK_STRATEGY_CARDS.map(card => card.styleValue),
      'Tactics playstyles'
    );
  });

  const [customStyleInput, setCustomStyleInput] = useState<string>('');
  const [showCustomStyleCreator, setShowCustomStyleCreator] = useState<boolean>(false);

  useEffect(() => {
    writeStringStorage(STORAGE_KEYS.matchFormat, matchFormat);
  }, [matchFormat]);

  useEffect(() => {
    if (!isFormationValidForFormat(matchFormat, formation)) {
      setFormation(getDefaultFormation(matchFormat));
    }
    if (!isFormationValidForFormat(matchFormat, opponentFormation)) {
      setOpponentFormation(getDefaultFormation(matchFormat));
    }
  }, [matchFormat, formation, opponentFormation]);

  useEffect(() => {
    writeStringStorage(STORAGE_KEYS.coachLevel, coachLevel);
  }, [coachLevel]);

  useEffect(() => {
    writeJsonStorage(STORAGE_KEYS.customPlaystyles, playstyles);
  }, [playstyles]);

  useEffect(() => {
    writeStringStorage(STORAGE_KEYS.formation, formation);
  }, [formation]);

  useEffect(() => {
    writeStringStorage(STORAGE_KEYS.opponentFormation, opponentFormation);
  }, [opponentFormation]);

  useEffect(() => {
    writeStringStorage(STORAGE_KEYS.playstyle, playstyle);
  }, [playstyle]);

  useEffect(() => {
    writeBooleanStorage(STORAGE_KEYS.isCustomStrategy, isCustomMode);
  }, [isCustomMode]);

  useEffect(() => {
    writeStringStorage(STORAGE_KEYS.customPlaystyle, customPlaystyleInput);
  }, [customPlaystyleInput]);

  useEffect(() => {
    writeStringStorage(STORAGE_KEYS.customDefensiveStyle, customDefensiveInput);
  }, [customDefensiveInput]);

  useEffect(() => {
    writeStringStorage(STORAGE_KEYS.customMentality, customMentality);
  }, [customMentality]);

  useEffect(() => {
    writeStringStorage(STORAGE_KEYS.customStrategyNotes, customStrategyNotes);
  }, [customStrategyNotes]);

  const [captainId, setCaptainId] = useState<string>(() => readStringStorage(STORAGE_KEYS.captainId, stringSchema, '', 'Tactics roles'));
  const [penaltyTakerId, setPenaltyTakerId] = useState<string>(() => readStringStorage(STORAGE_KEYS.penaltyTakerId, stringSchema, '', 'Tactics roles'));
  const [freeKickTakerId, setFreeKickTakerId] = useState<string>(() => readStringStorage(STORAGE_KEYS.freeKickTakerId, stringSchema, '', 'Tactics roles'));
  const [cornerTakerId, setCornerTakerId] = useState<string>(() => readStringStorage(STORAGE_KEYS.cornerTakerId, stringSchema, '', 'Tactics roles'));
  const [defensiveStyle, setDefensiveStyle] = useState<string>(() => readStringStorage(STORAGE_KEYS.defensiveStyle, stringSchema, 'High Press', 'Tactics defense'));

  const activeFormation = formation;
  const activePlaystyle = isCustomMode ? customPlaystyleInput : playstyle;
  const activeDefensiveStyle = isCustomMode ? customDefensiveInput : defensiveStyle;
  const matchupRecommendation = useMemo(() => recommendMatchupStrategy({
    ourFormation: formation,
    opponentFormation,
    matchFormat
  }), [formation, opponentFormation, matchFormat]);

  const visibleAttackStrategies = useMemo(() => {
    const byStyle = new Map(ATTACK_STRATEGY_CARDS.map(card => [card.styleValue, card]));
    const styles = Array.from(new Set([
      ...playstyles,
      ...ATTACK_STRATEGY_CARDS.map(card => card.styleValue)
    ]));
    return styles.map((style): TacticalStrategyCard => byStyle.get(style) ?? {
      id: `attack-custom-${style}`,
      phase: 'attack',
      title: style,
      styleValue: style,
      intent: 'Use this custom attacking idea as the team instruction for chance creation.',
      bestFor: 'Coach-defined situations where this custom style is already understood by players.',
      details: [
        { label: 'Entry', value: 'Coach-defined entry pattern' },
        { label: 'Target', value: 'Chosen opponent weakness' },
        { label: 'Support', value: 'Assigned support runners' },
        { label: 'Finish', value: 'Review outcome after match' }
      ],
      cues: ['Clarify trigger', 'Assign support', 'Review after match'],
      watchout: 'Custom styles need clear player instructions.',
      formationFit: [],
      opponentCounters: [],
      tags: ['custom']
    });
  }, [playstyles]);

  useEffect(() => {
    writeStringStorage(STORAGE_KEYS.captainId, captainId);
  }, [captainId]);
  useEffect(() => {
    writeStringStorage(STORAGE_KEYS.penaltyTakerId, penaltyTakerId);
  }, [penaltyTakerId]);
  useEffect(() => {
    writeStringStorage(STORAGE_KEYS.freeKickTakerId, freeKickTakerId);
  }, [freeKickTakerId]);
  useEffect(() => {
    writeStringStorage(STORAGE_KEYS.cornerTakerId, cornerTakerId);
  }, [cornerTakerId]);
  useEffect(() => {
    writeStringStorage(STORAGE_KEYS.defensiveStyle, defensiveStyle);
  }, [defensiveStyle]);

  // Highlighting active card index selected (0 to 10 starting slot)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(6); // Default: Roberto Carlos (LB - index 6 in default list)
  const [rightPanelTab, setRightPanelTab] = useState<'Basic' | 'Status'>('Basic');

  useEffect(() => {
    const size = MATCH_FORMAT_CONFIG[matchFormat].size;
    setSelectedSlotIndex(prev => Math.max(0, Math.min(prev, size - 1)));
  }, [matchFormat]);

  // Additional states to track status, yellow cards, red cards for each player id
  const [playerStatusExtras, setPlayerStatusExtras] = useState<PlayerStatusExtras>(() => {
    return readJsonStorage(STORAGE_KEYS.playerExtras, playerExtrasSchema, {}, 'Tactics player status');
  });

  useEffect(() => {
    writeJsonStorage(STORAGE_KEYS.playerExtras, playerStatusExtras);
  }, [playerStatusExtras]);

  // Sync actual player yellowCards/redCards from Player data into local extras
  useEffect(() => {
    setPlayerStatusExtras(prev => {
      let changed = false;
      const next = { ...prev };
      players.forEach(p => {
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

  const updatePlayerExtras = (playerId: string, updates: Partial<PlayerStatusExtras[string]> | null) => {
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
  const [quickNotes, setQuickNotes] = useState<TacticsNote[]>(() => {
    const defaultNotes: TacticsNote[] = [
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
    return readJsonStorage(STORAGE_KEYS.tacticsNotes, tacticsNotesSchema, defaultNotes, 'Tactics notes');
  });

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<TacticsNoteCategory>('Strategy');
  const [notesFilter, setNotesFilter] = useState<string>('All');

  // Inline editing state for individual note
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState('');
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [editingNoteCategory, setEditingNoteCategory] = useState<TacticsNoteCategory>('Strategy');

  useEffect(() => {
    writeJsonStorage(STORAGE_KEYS.tacticsNotes, quickNotes);
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

  const handleStartEditNote = (note: TacticsNote) => {
    setEditingNoteId(note.id);
    setEditingNoteTitle(note.title);
    setEditingNoteContent(note.content);
    setEditingNoteCategory(parseTacticsNoteCategory(note.category));
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

  const getTacticsAttributes = (player: Player): NonNullable<TacticsPlayer['attributes']> => {
    const base = player.baseAttributes || {
      pace: 50,
      stamina: 50,
      agility: 50,
      strength: 50,
      firstTouch: 50,
      shortPassing: 50
    };
    const positional = player.positionAttributes || {};
    const average = (...values: number[]) => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

    const shooting = player.position === 'Forward'
      ? average(positional.Finishing || 50, positional['Long Shots'] || 50)
      : positional['Long Shots'] || 50;
    const defending = player.position === 'Goalkeeper'
      ? average(positional.Reflexes || 50, positional.Handling || 50)
      : average(positional.Tackling || 50, positional.Positioning || 50);

    return {
      speed: base.pace,
      shooting,
      passing: base.shortPassing,
      dribbling: average(base.agility, base.firstTouch),
      defending,
      physicalness: average(base.stamina, base.strength)
    };
  };

  // Convert active registered club players into state format
  const allEligiblePool: TacticsPlayer[] = useMemo(() => {
    return players.map(p => {
        const tacticsAttributes = getTacticsAttributes(p);
        const attributesSum = Object.values(tacticsAttributes).reduce((sum, value) => sum + value, 0);
        const avg = Math.round(attributesSum / 6);
        return {
          id: p.id,
          name: p.name,
          rating: avg,
          position: p.position === 'Forward' ? 'CF' : p.position === 'Midfielder' ? 'AMF' : p.position === 'Defender' ? 'CB' : 'GK',
          condition: 'B' as const,
          photoUrl: p.photoUrl,
          isLegend: false,
          attributes: tacticsAttributes,
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
  const [lineup, setLineup] = useState<TacticsLineup>(() => {
    return readJsonStorage(
      STORAGE_KEYS.lineup,
      tacticsLineupSchema,
      {},
      'Tactics lineup'
    ) as unknown as TacticsLineup;
  });

  // Save lineup configuration changes
  useEffect(() => {
    writeJsonStorage(STORAGE_KEYS.lineup, lineup);
  }, [lineup]);

  // Click-and-drag coordinates state for lineup cards
  const [draggedPositions, setDraggedPositions] = useState<DraggedPositions>(() => {
    return readJsonStorage(STORAGE_KEYS.draggedPositions, draggedPositionsSchema, {}, 'Tactics positions');
  });

  useEffect(() => {
    writeJsonStorage(STORAGE_KEYS.draggedPositions, draggedPositions);
  }, [draggedPositions]);

  // Pointer Dragging trackers
  const activeDragItemRef = useRef<{ type: 'player' | 'ball' | 'wall'; index?: number } | null>(null);
  const activeDragPointerIdRef = useRef<number | null>(null);
  const dragStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const isDragMovingRef = useRef(false);

  // Drawing tools state
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [brushColor, setBrushColor] = useState<string>('#fbbf24'); // default Amber Yellow
  const [brushWidth, setBrushWidth] = useState<number>(3); // stroke thickness
  const [paths, setPaths] = useState<DrawingPath[]>(() => {
    return readJsonStorage(STORAGE_KEYS.drawingPaths, drawingPathsSchema, [], 'Tactics drawings') as DrawingPath[];
  });
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const currentPathRef = useRef<DrawingPath | null>(null);
  const activeDrawingPointerIdRef = useRef<number | null>(null);
  const lastDrawingPointRef = useRef<DrawingPoint | null>(null);

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
    const resolvedFormation = formation;

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
        else if (matchFormat === '9-a-side') effectiveParts = [3, 3, 2];
        else if (matchFormat === '8-a-side') effectiveParts = [2, 3, 2];
        else if (matchFormat === '7-a-side') effectiveParts = [2, 3, 1];
        else if (matchFormat === '6-a-side') effectiveParts = [2, 2, 1];
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
  }, [formation, matchFormat]);

  // Keep valid manual assignments, then fill open slots with the best position-matched players.
  useEffect(() => {
    setLineup(previous => buildPositionAwareLineup({
      players: allEligiblePool,
      slots: fieldPositions,
      size: MATCH_FORMAT_CONFIG[matchFormat].size,
      currentLineup: previous,
      preserveAssignments: true
    }));
  }, [allEligiblePool, fieldPositions, matchFormat]);

  const handleAutoFillBoard = () => {
    setLineup(buildPositionAwareLineup({
      players: allEligiblePool,
      slots: fieldPositions,
      size: MATCH_FORMAT_CONFIG[matchFormat].size,
      preserveAssignments: false
    }));
    setDraggedPositions({});
    setSelectedSlotIndex(0);
  };

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
    removeStorage(STORAGE_KEYS.drawingPaths);
    setBallPos({ left: 50, top: 40 });
    setWallPos({ left: 50, top: 72 });
  };

  const handleClearDrawings = () => {
    setPaths([]);
    removeStorage(STORAGE_KEYS.drawingPaths);
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
      writeJsonStorage(STORAGE_KEYS.drawingPaths, updated);
      return updated;
    });
  };

  const fieldRef = useRef<HTMLDivElement>(null);

  const getFieldPoint = (clientX: number, clientY: number): DrawingPoint | null => {
    if (!fieldRef.current) return null;
    const rect = fieldRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return [
      Math.max(0, Math.min(100, x)),
      Math.max(0, Math.min(100, y))
    ];
  };

  const finishDragInteraction = (e?: React.PointerEvent) => {
    activeDragItemRef.current = null;
    activeDragPointerIdRef.current = null;
    dragStartPointRef.current = null;

    if (e?.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const finishDrawingInteraction = (e?: React.PointerEvent<Element>) => {
    activeDrawingPointerIdRef.current = null;
    lastDrawingPointRef.current = null;

    if (e?.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // Field Pointer events for drawing on pitch in Drawing Mode
  const handleFieldPointerDown = (e: React.PointerEvent<Element>) => {
    if (!isDrawingMode || !fieldRef.current) return;
    
    // Check if dragging an element first
    if (activeDragItemRef.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const point = getFieldPoint(e.clientX, e.clientY);
    if (!point) return;

    e.preventDefault();
    activeDrawingPointerIdRef.current = e.pointerId;
    lastDrawingPointRef.current = point;
    const nextPath = {
      color: brushColor,
      width: brushWidth,
      points: [point]
    };

    currentPathRef.current = nextPath;
    setCurrentPath(nextPath);

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleFieldPointerMove = (e: React.PointerEvent<Element>) => {
    if (!isDrawingMode || !currentPathRef.current || !fieldRef.current) return;
    if (activeDrawingPointerIdRef.current !== e.pointerId) return;

    const point = getFieldPoint(e.clientX, e.clientY);
    if (!point) return;

    e.preventDefault();
    const lastPoint = lastDrawingPointRef.current;
    if (lastPoint) {
      const movedDistance = Math.hypot(point[0] - lastPoint[0], point[1] - lastPoint[1]);
      if (movedDistance < 0.35) return;
    }
    lastDrawingPointRef.current = point;
    
    setCurrentPath(prev => {
      const activePath = prev ?? currentPathRef.current;
      if (!activePath) return null;
      const nextPath = {
        ...activePath,
        points: [...activePath.points, point]
      };
      currentPathRef.current = nextPath;
      return nextPath;
    });
  };

  const handleFieldPointerUp = (e: React.PointerEvent<Element>) => {
    if (activeDrawingPointerIdRef.current !== null && activeDrawingPointerIdRef.current !== e.pointerId) return;
    const finishedPath = currentPathRef.current;
    if (finishedPath) {
      setPaths(prev => {
        const updated = [...prev, finishedPath];
        writeJsonStorage(STORAGE_KEYS.drawingPaths, updated);
        return updated;
      });
      setCurrentPath(null);
      currentPathRef.current = null;
    }
    finishDrawingInteraction(e);
  };

  // Element Specific Dragging handlers (incorporating pointer-capture)
  const handleElementPointerDown = (e: React.PointerEvent, type: 'player' | 'ball' | 'wall', index?: number) => {
    if (isDrawingMode) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const nextDragItem = { type, index };
    activeDragItemRef.current = nextDragItem;
    activeDragPointerIdRef.current = e.pointerId;
    dragStartPointRef.current = { x: e.clientX, y: e.clientY };
    isDragMovingRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleElementPointerMove = (e: React.PointerEvent) => {
    const dragItem = activeDragItemRef.current;
    if (!dragItem || !fieldRef.current) return;
    if (activeDragPointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    
    const rect = fieldRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Clamp to 0-100% margins
    const leftPercent = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
    const topPercent = Math.max(0, Math.min(100, Math.round((y / rect.height) * 100)));
    
    const startPoint = dragStartPointRef.current;
    if (startPoint && Math.hypot(e.clientX - startPoint.x, e.clientY - startPoint.y) > 4) {
      isDragMovingRef.current = true;
    }
    
    if (dragItem.type === 'player' && dragItem.index !== undefined) {
      const idx = dragItem.index;
      setDraggedPositions(prev => ({
        ...prev,
        [idx]: { left: leftPercent, top: topPercent }
      }));
    } else if (dragItem.type === 'ball') {
      setBallPos({ left: leftPercent, top: topPercent });
    } else if (dragItem.type === 'wall') {
      setWallPos({ left: leftPercent, top: topPercent });
    }
  };

  const handleElementPointerUp = (e: React.PointerEvent) => {
    if (activeDragPointerIdRef.current !== null && activeDragPointerIdRef.current !== e.pointerId) return;
    finishDragInteraction(e);
  };

  const handleRemovePlayer = (e: React.MouseEvent | React.PointerEvent, index: number) => {
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

  const renderSetPieceLeadership = () => (
    <div>
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-300">Set Piece & Leadership</label>
        <span className="text-[10px] text-slate-500">Assign only what you need for the next match.</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-400">Captain</span>
            <p className="mt-0.5 text-[11px] text-slate-400">Leads motivational boost.</p>
          </div>
          <Select value={captainId || EMPTY_SELECT_VALUE} onValueChange={(value) => setCaptainId(value === EMPTY_SELECT_VALUE ? '' : value)}>
            <SelectTrigger id="select-captain" className="h-8 rounded-lg border-slate-800 bg-slate-900 text-[11px] font-semibold text-slate-100 focus:ring-amber-400/30">
              <SelectValue placeholder="Select captain" />
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
              <SelectItem value={EMPTY_SELECT_VALUE}>Select captain</SelectItem>
              {allEligiblePool.map((player) => (
                <SelectItem key={player.id} value={player.id} className="text-xs font-bold">{player.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-cyan-400">Free Kicks</span>
            <p className="mt-0.5 text-[11px] text-slate-400">Takes precision direct kicks.</p>
          </div>
          <Select value={freeKickTakerId || EMPTY_SELECT_VALUE} onValueChange={(value) => setFreeKickTakerId(value === EMPTY_SELECT_VALUE ? '' : value)}>
            <SelectTrigger id="select-free-kick" className="h-8 rounded-lg border-slate-800 bg-slate-900 text-[11px] font-semibold text-slate-100 focus:ring-amber-400/30">
              <SelectValue placeholder="Select free kicker" />
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
              <SelectItem value={EMPTY_SELECT_VALUE}>Select free kicker</SelectItem>
              {allEligiblePool.map((player) => (
                <SelectItem key={player.id} value={player.id} className="text-xs font-bold">{player.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-400">Penalty Kicker</span>
            <p className="mt-0.5 text-[11px] text-slate-400">Assigned for highest composure.</p>
          </div>
          <Select value={penaltyTakerId || EMPTY_SELECT_VALUE} onValueChange={(value) => setPenaltyTakerId(value === EMPTY_SELECT_VALUE ? '' : value)}>
            <SelectTrigger id="select-penalties" className="h-8 rounded-lg border-slate-800 bg-slate-900 text-[11px] font-semibold text-slate-100 focus:ring-amber-400/30">
              <SelectValue placeholder="Select penalty kicker" />
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
              <SelectItem value={EMPTY_SELECT_VALUE}>Select penalty kicker</SelectItem>
              {allEligiblePool.map((player) => (
                <SelectItem key={player.id} value={player.id} className="text-xs font-bold">{player.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-yellow-400">Corner Kicks</span>
            <p className="mt-0.5 text-[11px] text-slate-400">Crosses from left and right flags.</p>
          </div>
          <Select value={cornerTakerId || EMPTY_SELECT_VALUE} onValueChange={(value) => setCornerTakerId(value === EMPTY_SELECT_VALUE ? '' : value)}>
            <SelectTrigger id="select-corners" className="h-8 rounded-lg border-slate-800 bg-slate-900 text-[11px] font-semibold text-slate-100 focus:ring-amber-400/30">
              <SelectValue placeholder="Select corner kicker" />
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
              <SelectItem value={EMPTY_SELECT_VALUE}>Select corner kicker</SelectItem>
              {allEligiblePool.map((player) => (
                <SelectItem key={player.id} value={player.id} className="text-xs font-bold">{player.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <div id="tactics-view-container" className="grid grid-cols-1 xl:grid-cols-12 gap-4 bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 text-slate-100 shadow-xl relative overflow-hidden">
      
      {/* Visual background ambient glow elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-650/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="xl:col-span-12 relative z-10">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#0f172a]/95 p-3 shadow-md">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Tactics Workspace</p>
              <h2 className="font-display text-lg font-black text-white">Match planning desk</h2>
              <p className="text-xs text-slate-400">Set the match shape, work the board, and manage supporting details without leaving the workspace.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-1">
              <Button
                type="button"
                onClick={() => setActiveWorkspaceSection('board')}
                variant="ghost"
                size="sm"
                className={`h-9 rounded-lg px-3 text-xs font-black uppercase tracking-wide ${
                  activeWorkspaceSection === 'board'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                Tactical Board
              </Button>
              <Button
                type="button"
                onClick={() => setActiveWorkspaceSection('library')}
                variant="ghost"
                size="sm"
                className={`h-9 rounded-lg px-3 text-xs font-black uppercase tracking-wide ${
                  activeWorkspaceSection === 'library'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                Coaching Library
              </Button>
            </div>
          </div>
          {activeWorkspaceSection === 'board' && (
            <div className="grid grid-cols-1 gap-2 border-t border-slate-800 pt-3 md:grid-cols-4">
              <Select value={matchFormat} onValueChange={(value) => setMatchFormat(value as MatchFormat)}>
                <SelectTrigger className="h-10 rounded-lg border-slate-800 bg-slate-950 text-xs font-bold text-slate-100 focus:ring-amber-400/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                  <SelectItem value="11-a-side">11-a-side</SelectItem>
                  <SelectItem value="9-a-side">9-a-side</SelectItem>
                  <SelectItem value="8-a-side">8-a-side</SelectItem>
                  <SelectItem value="7-a-side">7-a-side</SelectItem>
                  <SelectItem value="6-a-side">6-a-side</SelectItem>
                  <SelectItem value="5-a-side">5-a-side</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formation} onValueChange={setFormation}>
                <SelectTrigger className="h-10 rounded-lg border-slate-800 bg-slate-950 text-xs font-bold text-slate-100 focus:ring-amber-400/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                  {MATCH_FORMAT_CONFIG[matchFormat].formations.map((fmt) => (
                    <SelectItem key={fmt} value={fmt} className="text-xs font-bold">{fmt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active Style</p>
                <p className="truncate text-xs font-black text-amber-300">{activePlaystyle}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button type="button" onClick={handleAutoFillBoard} className="h-10 rounded-lg bg-emerald-500 px-2 text-[10px] font-black text-slate-950 hover:bg-emerald-400">
                  Auto Fill
                </Button>
                <Button type="button" onClick={handleClearBoard} variant="outline" className="h-10 rounded-lg border-rose-500/30 bg-rose-500/10 px-2 text-[10px] font-black text-rose-300 hover:bg-rose-500 hover:text-white">
                  Clear
                </Button>
                <Button type="button" onClick={() => setIsBoardFullscreen(true)} variant="outline" className="h-10 rounded-lg border-slate-700 bg-slate-950 px-2 text-[10px] font-black text-slate-200 hover:bg-slate-800">
                  <Maximize2 size={13} /> Fullscreen
                </Button>
              </div>
            </div>
          )}
          </div>
      </div>

      {activeWorkspaceSection === 'board' ? (
        <>
      {/* LEFT SIDE PANEL FOR NAVIGATION & CONTROLS */}
      <div className="xl:col-span-3 flex flex-col gap-5 relative z-10">
        
        {/* Coach Details Widget */}
        <div className="bg-[#0f172a]/95 p-4 rounded-2xl border border-slate-800/80 shadow-md">
          {isEditingCoach ? (
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/80">
                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest">Edit Coach Details</span>
                <Button
                  id="btn-save-coach-details"
                  type="button"
                  onClick={() => setIsEditingCoach(false)} 
                  size="sm"
                  className="h-7 rounded-md bg-emerald-600 px-2.5 text-[10px] font-black text-slate-950 shadow shadow-emerald-700/20 hover:bg-emerald-500"
                >
                  SAVE
                </Button>
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
                <Input
                  id="input-coach-level"
                  type="text" 
                  value={coachLevel} 
                  onChange={(e) => setCoachLevel(e.target.value)}
                  className="h-8 rounded-lg border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100 focus-visible:ring-amber-400/30"
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

              <Button
                id="btn-trigger-edit-coach"
                type="button"
                onClick={() => setIsEditingCoach(true)}
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-slate-400 hover:bg-white/5 hover:text-amber-400"
                title="Edit Coach Details"
                aria-label="Edit coach details"
              >
                <Edit size={14} />
              </Button>
            </div>
          )}
        </div>

        {/* Flag Box / Team Brand Crest Widget */}
        <div className="bg-[#0f172a]/95 p-4.5 rounded-2xl border border-slate-800/80 shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-slate-900/40 border border-slate-700/80 overflow-hidden shadow shadow-indigo-900/30 flex items-center justify-center">
              {renderTeamLogo(40, 'text-slate-200')}
            </div>
            <div>
              <h4 className="font-display font-black text-sm tracking-wide text-white">{teamName || "Apex Rangers"}</h4>
              <span className="text-[10px] text-slate-400 block -mt-0.5 uppercase tracking-wider font-semibold">Home Stadium Arena</span>
            </div>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded font-bold font-mono">CLUB</span>
        </div>

        <div className="bg-[#0f172a]/95 p-3 rounded-xl border border-slate-800/80 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block px-2 pb-2">Workspace Panels</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'squad' as const, label: 'Squad', icon: Users },
              { id: 'tactics' as const, label: 'Tactics', icon: SlidersHorizontal },
              { id: 'tools' as const, label: 'Tools', icon: Target },
              { id: 'notes' as const, label: 'Notes', icon: ClipboardList }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveBoardPanel(item.id);
                    if (item.id === 'tactics') setActiveTab('Tactics');
                    if (item.id === 'squad') setActiveTab('Team');
                  }}
                  variant="ghost"
                  size="sm"
                  className={`h-16 flex-col gap-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                    activeBoardPanel === item.id
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </Button>
              );
            })}
          </div>
          <div className="mt-3 space-y-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-[11px] text-slate-400">
            <div className="flex justify-between gap-3">
              <span>Formation</span>
              <span id="sidebar-val-formation" className="font-bold text-white">{activeFormation}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Playstyle</span>
              <span id="sidebar-val-playstyle" className="truncate font-bold text-amber-300">{activePlaystyle}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Defense</span>
              <span id="sidebar-val-defense" className="truncate font-bold text-emerald-400">{activeDefensiveStyle}</span>
            </div>
          </div>
          {activeBoardPanel === 'squad' && (
            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-800 pt-3">
              {[
                { id: 'Team' as const, label: `Starting ${MATCH_FORMAT_CONFIG[matchFormat].size}`, icon: UserCheck },
                { id: 'Substitutes' as const, label: `Substitutes (${substitutes.length})`, icon: Zap },
                { id: 'Reserves' as const, label: `Reserves (${allEligiblePool.length})`, icon: Shield }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    id={`sidebar-${item.id.toLowerCase()}`}
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    variant="ghost"
                    size="sm"
                    className={`h-9 w-full justify-start rounded-lg px-3 text-left text-xs font-bold ${
                      activeTab === item.id
                        ? 'bg-slate-800 text-white ring-1 ring-amber-400/50'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon size={14} className="text-amber-400" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>
          )}
        </div>

      </div>


      {/* MAIN SOCCER PITCH AREA */}
      <div
        className={cn(
          'xl:col-span-6 flex flex-col bg-emerald-950/20 rounded-xl p-3 sm:p-4 border border-slate-800 relative z-10',
          isBoardFullscreen && 'fixed inset-0 z-[70] overflow-y-auto rounded-none border-0 bg-slate-950/98 p-3 sm:p-5'
        )}
      >
        
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display font-black text-white text-sm tracking-widest uppercase text-emerald-400">Match Layout</h3>
            <p className="text-[11px] text-slate-400">{activeFormation} · {activePlaystyle} · {MATCH_FORMAT_CONFIG[matchFormat].size} players</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleAutoFillBoard}
              variant="outline"
              size="sm"
              className="h-7 rounded-lg border-emerald-500/30 bg-emerald-500/10 px-2 text-[7px] font-normal uppercase tracking-wider text-emerald-400 hover:bg-emerald-500 hover:text-slate-950"
            >
              Auto Fill
            </Button>
            <Button
              type="button"
              onClick={handleClearBoard}
              variant="outline"
              size="sm"
              className="h-7 rounded-lg border-rose-500/30 bg-rose-500/10 px-2 text-[7px] font-normal uppercase tracking-wider text-rose-400 hover:bg-rose-500 hover:text-white"
            >
              Clear Board
            </Button>
            <Button
              type="button"
              onClick={() => setIsBoardFullscreen((value) => !value)}
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-slate-700 bg-slate-950 px-2 text-[10px] font-black uppercase tracking-wider text-slate-200 hover:bg-slate-800"
              aria-label={isBoardFullscreen ? 'Exit match layout fullscreen' : 'Fullscreen match layout board'}
            >
              {isBoardFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              {isBoardFullscreen ? 'Exit' : 'Fullscreen'}
            </Button>
          </div>
        </div>

        {/* Render interactive Tactical Pitch Board */}
        <div 
          id="tactical-field-card" 
          ref={fieldRef}
          onPointerDown={handleFieldPointerDown}
          onPointerMove={handleFieldPointerMove}
          onPointerUp={handleFieldPointerUp}
          onPointerCancel={handleFieldPointerUp}
          onLostPointerCapture={finishDrawingInteraction}
          className={cn(
            'relative w-full max-w-[576px] aspect-[7/10] mx-auto bg-[#132c1b] rounded-xl overflow-hidden border border-emerald-900/60 shadow-lg select-none touch-none',
            isBoardFullscreen && 'max-h-[calc(100vh-9rem)] max-w-[min(92vw,780px)]'
          )}
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
            onPointerDown={handleFieldPointerDown}
            onPointerMove={handleFieldPointerMove}
            onPointerUp={handleFieldPointerUp}
            onPointerCancel={handleFieldPointerUp}
            onLostPointerCapture={finishDrawingInteraction}
            style={{ zIndex: isDrawingMode ? 30 : 10, pointerEvents: isDrawingMode ? 'auto' : 'none', touchAction: 'none' }}
          >
            {paths.map((p, idx) => (
              <path
                key={idx}
                d={p.points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt[0]} ${pt[1]}`).join(' ')}
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
                  onPointerCancel={handleElementPointerUp}
                  onLostPointerCapture={finishDragInteraction}
                  className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none z-20 group cursor-grab active:cursor-grabbing touch-none"
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
                  <div className="relative w-14 h-18 rounded-lg bg-slate-900/50 border border-slate-700 p-0.5 shadow-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-800 transition-all border-dashed select-none">
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
                onPointerCancel={handleElementPointerUp}
                onLostPointerCapture={finishDragInteraction}
                className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none z-20 group cursor-grab active:cursor-grabbing touch-none"
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
                <div className={`relative w-14 h-18 rounded-lg bg-gradient-to-b ${
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
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
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
                  className="absolute -top-3 -right-3 z-40 size-9 rounded-full border border-red-600 bg-rose-500 text-white opacity-100 shadow-xl hover:scale-110 hover:bg-rose-600 active:scale-95 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                  title="Remove Squad Player from Position"
                  aria-label={`Remove ${player.name || 'player'} from ${pos.role}`}
                >
                  <Trash2 size={14} />
                </Button>

                {/* Absolute naming label placed safely beneath card container */}
                <span
                  className="block min-w-14 max-w-24 whitespace-nowrap text-[10px] font-bold text-white bg-slate-950/95 px-1.5 py-0.5 rounded-md mt-1 shadow border border-slate-700 text-center tracking-wide overflow-hidden truncate"
                  title={player.name?.trim() || 'Player'}
                >
                  {player.name?.trim().split(/\s+/).slice(-1)[0] || 'Player'}
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
              onPointerCancel={handleElementPointerUp}
              onLostPointerCapture={finishDragInteraction}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center shadow-xl cursor-grab active:cursor-grabbing z-30 transition-shadow hover:scale-110 select-none animate-bounce-short touch-none"
              title="Tactical Match Ball (Drag to plot plays or attacking runs!)"
              role="button"
              aria-label="Drag tactical match ball"
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
              onPointerCancel={handleElementPointerUp}
              onLostPointerCapture={finishDragInteraction}
              className="absolute -translate-x-1/2 -translate-y-1/2 min-h-11 px-4 py-2 bg-red-650/95 border border-red-400 text-white rounded-lg flex items-center justify-center gap-1 shadow-2xl cursor-grab active:cursor-grabbing z-30 select-none hover:scale-105 touch-none"
              title="Defensive Wall (Drag/place on pitch!)"
              role="button"
              aria-label="Drag defensive wall"
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

        </div>

        <div
          id="tactical-field-style-summary"
          className="mt-3 w-full max-w-[576px] mx-auto rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-center shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {isCustomMode && (
              <span id="pitch-hud-val-mentality" className="text-[8.5px] text-indigo-400 font-bold uppercase tracking-widest">{customMentality}</span>
            )}
            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Active Tactic Style</span>
          </div>
          <p id="pitch-hud-val-playstyle" className="font-display font-black text-amber-400 text-sm leading-tight uppercase">{activePlaystyle}</p>
        </div>

      </div>


      {/* RIGHT SIDE FEATURED DETAIL CARD PANEL */}
      <div className="xl:col-span-3 space-y-5 flex flex-col relative z-10">

        {/* Coach's Playbook Toolkit */}
        <div className={cn('bg-[#0f172a]/95 p-4 rounded-xl border border-slate-800/80 shadow-lg space-y-4', activeBoardPanel !== 'tools' && 'hidden')}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-400" />
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400">COACH'S TOOLSET</h4>
                <p className="text-[9px] text-slate-500 font-mono">Interactive Playbook Designer</p>
              </div>
            </div>
            {isDrawingMode && (
              <Badge variant="warning" className="animate-pulse rounded px-1.5 py-0 text-[7.5px] font-mono">DRAW ACTIVE</Badge>
            )}
          </div>

          {/* Draw & Brush Tools Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5"><Edit size={12} /> Board Markings</span>
              <Button
                id="btn-coach-draw-toggle"
                type="button"
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                variant="outline"
                size="sm"
                className={`h-7 rounded-md px-2.5 text-[9px] font-extrabold uppercase tracking-wider ${
                  isDrawingMode
                    ? 'bg-amber-400 text-slate-950 border-amber-400 font-black shadow-md shadow-amber-400/10'
                    : 'bg-white/5 text-slate-400 hover:text-white border-slate-800/80'
                }`}
              >
                {isDrawingMode ? 'Drawing On' : 'Drawing Off'}
              </Button>
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
                      <Button
                        key={col.hex}
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setBrushColor(col.hex)}
                        style={{ backgroundColor: col.hex }}
                        className={`size-4 rounded-full border p-0 transition-transform hover:bg-transparent ${
                          brushColor === col.hex ? 'scale-125 border-cyan-400 ring-1 ring-cyan-500/30' : 'border-black/50 hover:scale-110'
                        }`}
                        title={col.label}
                        aria-label={`Set brush color to ${col.label}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">Brush Size</span>
                  <div className="flex gap-1">
                    {[2, 3, 5].map((size) => (
                      <Button
                        key={size}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setBrushWidth(size)}
                        className={`h-6 rounded px-2 text-[8.5px] font-mono font-bold ${
                          brushWidth === size ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-slate-100'
                        }`}
                      >
                        {size === 2 ? 'Thin' : size === 3 ? 'Mid' : 'Thick'}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Path controls help indicators */}
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                id="btn-coach-draw-undo"
                type="button"
                disabled={paths.length === 0}
                onClick={handleUndoDrawing}
                variant="outline"
                size="sm"
                className="h-8 rounded-lg border-slate-800/80 bg-slate-850 px-2 text-[9.5px] font-bold text-slate-300 hover:bg-slate-805 hover:text-white disabled:opacity-30"
              >
                <RefreshCw size={11} /> Undo Line
              </Button>
              <Button
                id="btn-coach-draw-clear"
                type="button"
                disabled={paths.length === 0}
                onClick={handleClearDrawings}
                variant="outline"
                size="sm"
                className="h-8 rounded-lg border-slate-800/80 bg-rose-500/5 px-2 text-[9.5px] font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-30"
                title="Clear all drawn board lines"
              >
                <Trash2 size={11} /> Clear Ink
              </Button>
            </div>
          </div>

          {/* Tactical Game Elements Section */}
          <div className="border-t border-slate-800/60 pt-3 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5"><Target size={12} /> Accessories & Runs</span>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                id="btn-coach-ball-toggle"
                type="button"
                onClick={() => setShowBall(!showBall)}
                variant="outline"
                size="sm"
                className={`h-9 justify-between rounded-xl px-2.5 text-left ${
                  showBall
                    ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/15 hover:text-emerald-300'
                    : 'bg-slate-900/40 text-slate-400 border-slate-805 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-[10.5px] font-bold flex items-center gap-1"><Target size={11} /> Ball Icon</span>
                <span className="text-[9px] font-bold uppercase">{showBall ? 'On' : 'Off'}</span>
              </Button>

              <Button
                id="btn-coach-wall-toggle"
                type="button"
                onClick={() => setShowWall(!showWall)}
                variant="outline"
                size="sm"
                className={`h-9 justify-between rounded-xl px-2.5 text-left ${
                  showWall
                    ? 'bg-red-650/10 text-red-500 border-red-500/20 hover:bg-red-650/15 hover:text-red-400'
                    : 'bg-slate-900/40 text-slate-400 border-slate-805 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-[10.5px] font-bold flex items-center gap-1"><Shield size={11} /> Def. Wall</span>
                <span className="text-[9px] font-bold uppercase">{showWall ? 'On' : 'Off'}</span>
              </Button>
            </div>

            {/* Reset Drags Action */}
            <Button
              id="btn-coach-reset-drag"
              type="button"
              onClick={handleResetPositions}
              variant="outline"
              size="sm"
              className="h-9 w-full rounded-xl border-slate-800/80 bg-slate-900 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:border-slate-700 hover:bg-slate-850 hover:text-white"
            >
              <RefreshCw size={12} /> Reset Dragged Offsets
            </Button>
            
            <p className="text-[8.5px] text-slate-500 italic text-center leading-normal">
              <Info size={11} className="inline-block align-[-2px] text-slate-500" /> Toggle <strong>Drawing On</strong> to paint runs, or <strong>Drawing Off</strong> to drag players, the ball & the defensive wall!
            </p>
          </div>
        </div>

        {/* Featured Player detail display (eFootball card look) */}
        <div className="bg-[#0f172a]/95 p-4 rounded-2xl border border-slate-850 shadow-md flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">POSITION DETAIL VIEW</span>
              <div className="flex bg-slate-800 text-slate-300 p-0.5 rounded-lg text-[10px] font-bold">
                <Button
                  type="button"
                  onClick={() => setRightPanelTab('Basic')} 
                  variant="ghost"
                  size="sm"
                  className={`h-7 rounded-md px-2.5 text-[10px] font-bold ${rightPanelTab === 'Basic' ? 'bg-indigo-600 text-white font-extrabold hover:bg-indigo-600' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                >
                  Basic
                </Button>
                <Button
                  type="button"
                  onClick={() => setRightPanelTab('Status')} 
                  variant="ghost"
                  size="sm"
                  className={`h-7 rounded-md px-2.5 text-[10px] font-bold ${rightPanelTab === 'Status' ? 'bg-indigo-600 text-white font-extrabold hover:bg-indigo-600' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                >
                  Status
                </Button>
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
                            <Button
                              id={`status-btn-${st}`}
                              key={st}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updatePlayerExtras(activeSelectedPlayer.id, { status: st })}
                              className={`h-8 rounded-lg px-1 text-center text-[10px] font-bold capitalize ${bgClass}`}
                            >
                              {st}
                            </Button>
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
                        <Button
                          id="btn-remove-yellow"
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = getPlayerExtras(activeSelectedPlayer.id).yellowCards;
                            updatePlayerExtras(activeSelectedPlayer.id, { yellowCards: Math.max(0, current - 1) });
                          }}
                          className="h-8 flex-1 rounded-lg border-slate-700 bg-slate-800 px-2 text-[10px] font-bold text-slate-350 hover:bg-slate-750 hover:text-slate-100"
                        >
                          Clear Card
                        </Button>
                        <Button
                          id="btn-add-yellow"
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = getPlayerExtras(activeSelectedPlayer.id).yellowCards;
                            updatePlayerExtras(activeSelectedPlayer.id, { yellowCards: Math.min(2, current + 1) });
                          }}
                          className="h-8 flex-1 rounded-lg border-yellow-600/30 bg-yellow-500 px-2 text-[10px] font-bold text-slate-950 hover:bg-yellow-400"
                        >
                          + Add Yellow
                        </Button>
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
                        <Button
                          id="btn-toggle-red"
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = getPlayerExtras(activeSelectedPlayer.id).redCards;
                            updatePlayerExtras(activeSelectedPlayer.id, { redCards: current > 0 ? 0 : 1 });
                          }}
                          className={`h-8 w-full rounded-lg px-2 text-center text-[10px] font-black ${
                            getPlayerExtras(activeSelectedPlayer.id).redCards > 0
                              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-700 font-extrabold'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
                          }`}
                        >
                          <span className="size-2.5 rounded-full bg-red-500" />
                          {getPlayerExtras(activeSelectedPlayer.id).redCards > 0 ? 'Dismiss red card' : 'Sentence red card'}
                        </Button>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            ) : (
              <div className="mt-4 py-8 px-4 bg-slate-950/40 rounded-2xl border border-slate-900/60 border-dashed text-center space-y-3.5">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                  <User size={20} />
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
            <Label className="mb-1.5 flex items-center gap-1.5 text-slate-400">
              {activeSelectedPlayer ? <RefreshCw size={11} /> : <UserCheck size={11} />}
              {activeSelectedPlayer ? 'Swap athlete / re-assign position' : 'Assign athlete to position'}
            </Label>
            <div className="relative">
              <Select
                value={activeSelectedPlayer?.id || EMPTY_SELECT_VALUE}
                onValueChange={(value) => {
                  if (value === EMPTY_SELECT_VALUE) return;
                  const found = allEligiblePool.find(p => p.id === value);
                  if (found) {
                    handleAssignPlayer(found);
                  }
                }}
              >
                <SelectTrigger
                  id="select-squad-player"
                  className="h-9 rounded-xl border-slate-800 bg-slate-900 text-xs font-bold text-amber-300 focus:ring-amber-400/30"
                >
                  <SelectValue placeholder={activeSelectedPlayer ? 'Keep current athlete' : 'Choose athlete to place'} />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                  <SelectItem value={EMPTY_SELECT_VALUE} disabled className="text-slate-500">
                    {activeSelectedPlayer ? 'Keep current athlete' : 'Choose athlete to place'}
                  </SelectItem>
                  {allEligiblePool.map(p => {
                    const isAssignedElsewhere = (Object.values(lineup) as (TacticsPlayer | null | undefined)[]).some(lp => lp?.id === p.id && lp?.id !== activeSelectedPlayer?.id);
                    return (
                      <SelectItem key={p.id} value={p.id} className="text-xs font-bold">
                        {p.name} ({p.position} - Rating: {p.rating}) {isAssignedElsewhere ? '[On pitch]' : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* SQUAD SETTING DIRECTORY CONFIG PANEL */}
      <AnimatePresence>
        {activeBoardPanel === 'tactics' && activeTab === 'Tactics' && (
          <motion.div 
            id="tactics-panel-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="xl:col-span-12 bg-[#0f172a]/95 border border-slate-800 rounded-xl p-4 text-xs select-none relative shadow-lg lg:p-5"
          >
            <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="font-display font-black text-white flex items-center gap-2 uppercase tracking-wide">
                  <BarChart2 className="text-amber-400 shrink-0" size={16} /> Playstyle Tactics & Formations
                </h4>
                <p className="mt-1 text-[11px] text-slate-400">
                  Pick a shape, then choose the game behavior your players should recognize on the field.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                <span className={`text-[10px] font-black tracking-wider leading-none ${isCustomMode ? 'text-amber-400' : 'text-slate-500'}`}>
                  {isCustomMode ? 'Custom plan' : 'Preset guidance'}
                </span>
                <Button
                  id="toggle-custom-strategy-mode"
                  type="button"
                  aria-pressed={isCustomMode}
                  onClick={() => setIsCustomMode(!isCustomMode)}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 w-12 justify-start rounded-full border border-slate-700 bg-slate-800 p-0.5 hover:bg-slate-700',
                    isCustomMode && 'justify-end border-indigo-500 bg-indigo-600 hover:bg-indigo-600'
                  )}
                  aria-label="Toggle custom strategy mode"
                >
                  <span className="size-5 rounded-full border border-slate-300 bg-white shadow-sm" />
                </Button>
              </div>
            </div>

            {/* Team Formation (shared for both modes) */}
            <div className="my-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <label className="text-[10px] font-black tracking-widest text-slate-300 uppercase block">Formation Library</label>
                  <span className="text-[10px] text-slate-500">{matchFormat} · {MATCH_FORMAT_CONFIG[matchFormat].formations.length} shapes</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {MATCH_FORMAT_CONFIG[matchFormat].formations.map((fmt) => (
                    <Button
                      id={`btn-formation-${fmt}`}
                      key={fmt}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormation(fmt)}
                      className={`h-9 rounded-lg px-2 text-center text-[11px] font-black ${
                        formation === fmt
                          ? 'border-amber-400 bg-amber-400 text-slate-950 hover:bg-amber-300'
                          : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {fmt}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Current Game Plan</span>
                <dl className="mt-3 space-y-2 text-[11px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Shape</dt>
                    <dd className="font-black text-amber-300">{formation}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Attack</dt>
                    <dd className="truncate font-black text-indigo-300">{activePlaystyle}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Defend</dt>
                    <dd className="truncate font-black text-emerald-300">{activeDefensiveStyle}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Opponent</dt>
                    <dd className="font-black text-sky-300">{opponentFormation}</dd>
                  </div>
                </dl>
                <p className="mt-3 border-t border-slate-800 pt-3 text-[11px] leading-relaxed text-slate-400">
                  Match format stays in the top command bar. This panel focuses on decisions players need to execute.
                </p>
              </div>
            </div>

            <section className="mb-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
              <div className="grid grid-cols-1 gap-3 border-b border-slate-800 pb-3 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Matchup Strategy</h5>
                  <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-slate-500">
                    Compare shapes, review the coaching read, then apply only the plan you want to use.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Our shape</span>
                    <div className="flex h-10 items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs font-black text-amber-300">
                      <span>{formation}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{MATCH_FORMAT_CONFIG[matchFormat].size}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Opponent shape</label>
                    <Select value={opponentFormation} onValueChange={setOpponentFormation}>
                      <SelectTrigger id="select-opponent-formation" className="h-10 rounded-lg border-slate-800 bg-slate-900 px-3 text-xs font-black text-sky-200 focus:ring-sky-400/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                        {MATCH_FORMAT_CONFIG[matchFormat].formations.map((fmt) => (
                          <SelectItem key={fmt} value={fmt} className="text-xs font-bold">{fmt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
                <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-3.5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Recommended attack</span>
                      <h6 className="mt-1 text-base font-black text-white">{matchupRecommendation.recommendedAttack.title}</h6>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setPlaystyle(matchupRecommendation.recommendedAttack.styleValue)}
                      className="h-9 rounded-lg bg-indigo-500 px-3 text-[10px] font-black text-white hover:bg-indigo-600"
                    >
                      Apply attacking plan
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{matchupRecommendation.recommendedAttack.intent}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {matchupRecommendation.recommendedAttack.details.map((detail) => (
                      <div key={`${matchupRecommendation.recommendedAttack.id}-${detail.label}`} className="rounded-md border border-indigo-500/15 bg-slate-950/35 px-2.5 py-2">
                        <span className="block text-[8.5px] font-black uppercase tracking-widest text-indigo-300/80">{detail.label}</span>
                        <span className="mt-1 block text-[10.5px] font-semibold leading-snug text-slate-200">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {matchupRecommendation.recommendedAttack.cues.map((cue) => (
                      <span key={cue} className="rounded-md border border-indigo-500/20 bg-slate-950/50 px-2 py-1 text-[9.5px] font-bold text-indigo-100">{cue}</span>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] leading-relaxed text-amber-200/80">Watch: {matchupRecommendation.recommendedAttack.watchout}</p>
                </div>

                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3.5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-200">Recommended defense</span>
                      <h6 className="mt-1 text-base font-black text-white">{matchupRecommendation.recommendedDefense.title}</h6>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setDefensiveStyle(matchupRecommendation.recommendedDefense.styleValue)}
                      className="h-9 rounded-lg bg-emerald-500 px-3 text-[10px] font-black text-slate-950 hover:bg-emerald-400"
                    >
                      Apply defensive plan
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{matchupRecommendation.recommendedDefense.intent}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {matchupRecommendation.recommendedDefense.details.map((detail) => (
                      <div key={`${matchupRecommendation.recommendedDefense.id}-${detail.label}`} className="rounded-md border border-emerald-500/15 bg-slate-950/35 px-2.5 py-2">
                        <span className="block text-[8.5px] font-black uppercase tracking-widest text-emerald-300/80">{detail.label}</span>
                        <span className="mt-1 block text-[10.5px] font-semibold leading-snug text-slate-200">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {matchupRecommendation.recommendedDefense.cues.map((cue) => (
                      <span key={cue} className="rounded-md border border-emerald-500/20 bg-slate-950/50 px-2 py-1 text-[9.5px] font-bold text-emerald-100">{cue}</span>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] leading-relaxed text-amber-200/80">Watch: {matchupRecommendation.recommendedDefense.watchout}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-3">
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-300">Threat</span>
                  <p className="mt-1 text-[10.5px] leading-snug text-slate-400">{matchupRecommendation.opponentThreats[0]}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-300">Space</span>
                  <p className="mt-1 text-[10.5px] leading-snug text-slate-400">{matchupRecommendation.exploitableSpaces[0]}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-sky-300">Cue</span>
                  <p className="mt-1 text-[10.5px] leading-snug text-slate-400">{matchupRecommendation.playerInstructions[0]}</p>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-sky-500/20 bg-sky-500/10 p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-sky-200">Coach Read</span>
                  <span className="text-[10px] font-black text-slate-300">{formation} vs {opponentFormation}</span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {matchupRecommendation.comparisonInsights.map((insight) => (
                    <div key={insight.label} className="rounded-md border border-sky-500/10 bg-slate-950/35 px-2.5 py-2">
                      <span className="block text-[8.5px] font-black uppercase tracking-widest text-sky-300/80">{insight.label}</span>
                      <span className="mt-1 block text-[10.5px] font-semibold leading-relaxed text-slate-200">{insight.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {isCustomMode ? (
              <motion.div 
                id="custom-strategy-blueprint-editor"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mb-4"
              >
                {/* Custom Tactic Playstyle */}
                <div className="lg:col-span-6 space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-300 uppercase block">
                    Custom Playstyle Directive
                  </label>
                  <Input
                    type="text"
                    id="input-custom-playstyle"
                    value={customPlaystyleInput}
                    onChange={(e) => setCustomPlaystyleInput(e.target.value)}
                    placeholder="Direct Attacking Tiki-Taka"
                    className="h-9 rounded-lg border-slate-800 bg-slate-900 text-xs font-bold text-indigo-300 focus-visible:ring-indigo-400/30"
                  />
                </div>

                {/* Custom Defensive Playstyle */}
                <div className="lg:col-span-6 space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-300 uppercase block">
                    Custom Defensive Anchor
                  </label>
                  <Input
                    type="text"
                    id="input-custom-defensive"
                    value={customDefensiveInput}
                    onChange={(e) => setCustomDefensiveInput(e.target.value)}
                    placeholder="Aggressive Wing Press"
                    className="h-9 rounded-lg border-slate-800 bg-slate-900 text-xs font-bold text-emerald-400 focus-visible:ring-emerald-500/30"
                  />
                </div>

                {/* Strategy Mentalities & Detailed commentary text notes */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-5 border-t border-slate-800/80 pt-4 mt-1">
                  
                  {/* Tactic Mentality */}
                  <div className="md:col-span-4 space-y-2">
                    <label className="text-[10px] font-black tracking-widest text-slate-300 uppercase block">
                      Tactical Mentality Setting
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <Select
                        value={customMentality}
                        onValueChange={setCustomMentality}
                      >
                        <SelectTrigger
                          id="select-custom-mentality"
                          className="h-9 rounded-lg border-slate-800 bg-slate-900 text-xs font-bold text-slate-100 focus:ring-indigo-500/30"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                          <SelectItem value="Ultra Defensive">Ultra Defensive (Park the Bus)</SelectItem>
                          <SelectItem value="Defensive">Defensive (Cautious Build Up)</SelectItem>
                          <SelectItem value="Balanced">Balanced (Fluid Interchange)</SelectItem>
                          <SelectItem value="Attacking">Attacking (Overload Flanks)</SelectItem>
                          <SelectItem value="Ultra Attacking">Ultra Attacking (All Out Rush)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tactical notes */}
                  <div className="md:col-span-8 space-y-2">
                    <label className="text-[10px] font-black tracking-widest text-slate-300 uppercase block">
                      Coach Directives & Game Plan Commentary
                    </label>
                    <Textarea
                      id="textarea-custom-strategy-notes"
                      value={customStrategyNotes}
                      onChange={(e) => setCustomStrategyNotes(e.target.value)}
                      rows={3}
                      placeholder="Input comprehensive instructions, marking guides, setup requirements..."
                      className="min-h-24 rounded-lg border-slate-800 bg-slate-900 text-xs font-medium text-slate-200 focus-visible:ring-indigo-500/30"
                    />
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <section className="flex h-[34rem] flex-col rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="mb-3">
                    <h5 className="text-[10px] font-black tracking-widest text-slate-300 uppercase">Attacking Plan</h5>
                    <p className="mt-1 text-[11px] text-slate-500">Select how the team should create chances after winning or keeping the ball.</p>
                  </div>
                  <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto pr-1">
                    {visibleAttackStrategies.map((guidance) => {
                      const selected = playstyle === guidance.styleValue;
                      return (
                        <button
                          id={`btn-playstyle-${guidance.styleValue.replaceAll(' ', '-')}`}
                          key={guidance.id}
                          type="button"
                          onClick={() => setPlaystyle(guidance.styleValue)}
                          className={`rounded-xl border p-3 text-left transition ${
                            selected
                              ? 'border-indigo-400 bg-indigo-500/15 shadow-sm shadow-indigo-500/10'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-black text-white">{guidance.title}</span>
                            {selected && <Badge className="rounded bg-indigo-500 px-2 py-0.5 text-[9px] text-white">Active</Badge>}
                          </div>
                          <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{guidance.intent}</p>
                          <p className="mt-2 text-[10px] leading-relaxed text-slate-500"><strong className="text-slate-400">Best for:</strong> {guidance.bestFor}</p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {guidance.cues.map((cue) => (
                              <span key={cue} className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-[9.5px] font-bold text-indigo-200">{cue}</span>
                            ))}
                          </div>
                          <p className="mt-2 text-[10px] text-amber-300/80">Watch: {guidance.watchout}</p>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="flex h-[34rem] flex-col rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="mb-3">
                    <h5 className="text-[10px] font-black tracking-widest text-slate-300 uppercase">Defensive Plan</h5>
                    <p className="mt-1 text-[11px] text-slate-500">Define the team trigger, line height, and first recovery behavior out of possession.</p>
                  </div>
                  <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto pr-1">
                    {DEFENSE_STRATEGY_CARDS.map((guidance) => {
                      const selected = defensiveStyle === guidance.styleValue;
                      return (
                        <button
                          id={`btn-defstyle-${guidance.styleValue.replaceAll(' ', '-')}`}
                          key={guidance.id}
                          type="button"
                          onClick={() => setDefensiveStyle(guidance.styleValue)}
                          className={`rounded-xl border p-3 text-left transition ${
                            selected
                              ? 'border-emerald-400 bg-emerald-500/15 shadow-sm shadow-emerald-500/10'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-black text-white">{guidance.title}</span>
                            {selected && <Badge className="rounded bg-emerald-500 px-2 py-0.5 text-[9px] text-slate-950">Active</Badge>}
                          </div>
                          <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{guidance.intent}</p>
                          <p className="mt-2 text-[10px] leading-relaxed text-slate-500"><strong className="text-slate-400">Best for:</strong> {guidance.bestFor}</p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {guidance.cues.map((cue) => (
                              <span key={cue} className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9.5px] font-bold text-emerald-200">{cue}</span>
                            ))}
                          </div>
                          <p className="mt-2 text-[10px] text-amber-300/80">Watch: {guidance.watchout}</p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
          </motion.div>
        )}

        {activeBoardPanel === 'squad' && (
          <motion.div
            id="squad-set-piece-leadership-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="xl:col-span-12 rounded-xl border border-slate-800 bg-[#0f172a] p-5"
          >
            {renderSetPieceLeadership()}
          </motion.div>
        )}

        {/* Start list of active players for team tab */}
        {activeBoardPanel === 'squad' && activeTab === 'Team' && (
          <motion.div 
            id="team-list-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="xl:col-span-12 max-h-[48vh] overflow-y-auto bg-[#0f172a] border border-slate-800 rounded-xl p-5"
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
        {activeBoardPanel === 'squad' && activeTab === 'Substitutes' && (
          <motion.div 
            id="substitutes-list-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="xl:col-span-12 max-h-[48vh] overflow-y-auto bg-[#0f172a] border border-slate-800 rounded-xl p-5"
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
        {activeBoardPanel === 'squad' && activeTab === 'Reserves' && (
          <motion.div 
            id="reserves-list-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="xl:col-span-12 max-h-[48vh] overflow-y-auto bg-[#0f172a] border border-slate-800 rounded-xl p-5"
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
      <div id="tactics-quick-notes-panel" className={cn('xl:col-span-12 max-h-[68vh] overflow-y-auto bg-[#0f172a] border border-slate-800 rounded-xl p-5 select-none relative z-10', activeBoardPanel !== 'notes' && 'hidden')}>
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
              <Button
                key={cat}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setNotesFilter(cat)}
                className={`h-7 rounded-lg px-3 text-[10px] font-black ${
                  notesFilter === cat 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </Button>
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
                <Input
                  type="text"
                  required
                  placeholder="e.g. Near-Post Header Routine"
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                  className="h-9 rounded-lg border-slate-800 bg-slate-950 text-xs font-semibold text-slate-200 placeholder:text-slate-600 focus-visible:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">
                  Category
                </label>
                <Select
                  value={noteCategory}
                  onValueChange={(value) => setNoteCategory(parseTacticsNoteCategory(value))}
                >
                  <SelectTrigger className="h-9 rounded-lg border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 focus:ring-amber-500/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                    {TACTICS_NOTE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category} className="text-xs font-bold">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">
                  Note Text / Instructions
                </label>
                <Textarea
                  required
                  rows={3}
                  placeholder="Write clear play instructions or defensive roles..."
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  className="min-h-24 resize-none rounded-lg border-slate-800 bg-slate-950 text-xs font-medium leading-relaxed text-slate-200 placeholder:text-slate-600 focus-visible:ring-amber-500/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-10 w-full rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
            >
              <Plus size={13} /> Include in Playbook
            </Button>
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
                            <Select
                              value={editingNoteCategory}
                              onValueChange={(value) => setEditingNoteCategory(parseTacticsNoteCategory(value))}
                            >
                              <SelectTrigger className="h-7 w-32 rounded border-slate-800 bg-slate-950 px-2 text-[10px] text-slate-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                                {TACTICS_NOTE_CATEGORIES.map((category) => (
                                  <SelectItem key={category} value={category} className="text-xs">
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Input
                            type="text"
                            value={editingNoteTitle}
                            onChange={e => setEditingNoteTitle(e.target.value)}
                            className="h-8 rounded border-slate-800 bg-slate-950 px-2 py-1 text-xs font-bold text-slate-200"
                          />
                          <Textarea
                            rows={3}
                            value={editingNoteContent}
                            onChange={e => setEditingNoteContent(e.target.value)}
                            className="min-h-24 resize-none rounded border-slate-800 bg-slate-950 px-2 py-1 text-xs font-medium leading-relaxed text-slate-300"
                          />
                        </div>
                      ) : (
                        /* Standard display note */
                        <div>
                          <div className="flex items-center justify-between gap-2.5 mb-1.5">
                            <Badge className={`rounded-md px-1.5 py-0 text-[9.5px] ${catStyle}`}>
                              {note.category || 'General'}
                            </Badge>
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
                            <Button
                              type="button"
                              onClick={() => handleSaveEditNote(note.id)}
                              size="sm"
                              className="h-7 rounded bg-emerald-600 px-2.5 text-[10px] font-black text-slate-950 hover:bg-emerald-500"
                            >
                              <Check size={11} /> Save
                            </Button>
                            <Button
                              type="button"
                              onClick={() => setEditingNoteId(null)}
                              variant="ghost"
                              size="sm"
                              className="h-7 rounded px-2.5 text-[10px] font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              onClick={() => handleStartEditNote(note)}
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[10px] font-bold text-slate-400 hover:bg-amber-500/10 hover:text-amber-400"
                            >
                              <Edit size={11} /> Edit
                            </Button>
                            <span className="text-slate-800 text-[10px]">|</span>
                            <Button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[10px] font-bold text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"
                            >
                              <Trash2 size={11} /> Delete
                            </Button>
                          </>
                        )}
                      </div>

                    </div>
                  );
                })}

              {quickNotes.filter(note => notesFilter === 'All' || note.category === notesFilter).length === 0 && (
                <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-slate-800 rounded-xl">
                  <BookOpen size={18} className="text-slate-500" />
                  <p className="text-xs text-slate-400 font-medium">No playbook reminders match the "{notesFilter}" filter.</p>
                  <p className="text-[10px] text-slate-505">Create a new key note on the left to populate your layout!</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

        </>
      ) : (
        <CoachKnowledgeBase />
      )}

    </div>
  );
}
