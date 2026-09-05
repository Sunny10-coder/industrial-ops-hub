import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

type Role =
  | 'System Admin'
  | 'Manager'
  | 'Assistant Manager'
  | 'Safety Officer'
  | 'Supervisor'
  | 'Engineer';

type ShiftType = 'Morning' | 'Afternoon' | 'Night';
type LeaveType = 'Annual' | 'Sick' | 'Comp-Off' | 'Emergency';
type ObservationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Assigned'
  | 'Open'
  | 'In Progress'
  | 'Closeout'
  | 'Verification'
  | 'Closed'
  | 'Reopened';

type ModuleKey = 'hub' | 'safety' | 'workforce' | 'reports' | 'settings';

type Observation = {
  id: number;
  title: string;
  area: string;
  assignee: string;
  severity: 'Low' | 'Medium' | 'High';
  status: ObservationStatus;
  photoNote?: string;
  appeals: { reason: string; evidence: string }[];
};

type AttendanceRecord = {
  employee: string;
  date: string;
  shift: ShiftType;
  mission: string;
  checkedIn: boolean;
};

type LeaveRequest = {
  id: number;
  employee: string;
  type: LeaveType;
  date: string;
  status: 'Pending' | 'Approved';
};

const ROLES: Role[] = [
  'System Admin',
  'Manager',
  'Assistant Manager',
  'Safety Officer',
  'Supervisor',
  'Engineer',
];

const roleModules: Record<Role, ModuleKey[]> = {
  'System Admin': ['hub', 'safety', 'workforce', 'reports', 'settings'],
  Manager: ['hub', 'safety', 'workforce', 'reports', 'settings'],
  'Assistant Manager': ['hub', 'safety', 'workforce', 'reports'],
  'Safety Officer': ['hub', 'safety', 'reports'],
  Supervisor: ['hub', 'safety', 'workforce', 'reports'],
  Engineer: ['hub', 'safety', 'workforce'],
};

const navItems: { key: ModuleKey; label: string }[] = [
  { key: 'hub', label: 'Home' },
  { key: 'safety', label: 'Safety' },
  { key: 'workforce', label: 'Workforce' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
];

const statusFlow: ObservationStatus[] = [
  'Draft',
  'Submitted',
  'Assigned',
  'Open',
  'In Progress',
  'Closeout',
  'Verification',
  'Closed',
];

const shiftColors: Record<ShiftType, string> = {
  Morning: '#F9D549',
  Afternoon: '#F5973A',
  Night: '#39D4E6',
};

const moduleDescriptions: Record<Exclude<ModuleKey, 'hub'>, string> = {
  safety: 'Capture, triage, and close safety observations.',
  workforce: 'Manage shifts, attendance, and leave flows.',
  reports: 'Executive metrics and reporting export hooks.',
  settings: 'Role, notification, and app preference controls.',
};

const initialObservations: Observation[] = [
  {
    id: 1,
    title: 'Forklift blind-spot mirror damaged',
    area: 'Warehouse Bay A',
    assignee: 'Ravi Patel',
    severity: 'High',
    status: 'In Progress',
    photoNote: 'Photo attached at loading dock.',
    appeals: [],
  },
  {
    id: 2,
    title: 'Chemical drum labeling faded',
    area: 'Storage Room 3',
    assignee: 'Sarah Osei',
    severity: 'Medium',
    status: 'Submitted',
    appeals: [],
  },
  {
    id: 3,
    title: 'PPE station requires refill',
    area: 'Assembly Line 2',
    assignee: 'Karan Das',
    severity: 'Low',
    status: 'Verification',
    appeals: [
      {
        reason: 'Refill done but still marked open',
        evidence: 'Refill log #PPE-229 and counter photo',
      },
    ],
  },
];

const initialAttendance: AttendanceRecord[] = [
  {
    employee: 'Anita Rao',
    date: 'Mon',
    shift: 'Morning',
    mission: 'Inbound receiving',
    checkedIn: true,
  },
  {
    employee: 'Daniel Lim',
    date: 'Tue',
    shift: 'Afternoon',
    mission: 'Inventory audit',
    checkedIn: false,
  },
  {
    employee: 'Farah Khan',
    date: 'Wed',
    shift: 'Night',
    mission: 'Dispatch support',
    checkedIn: false,
  },
];

const initialLeaveRequests: LeaveRequest[] = [
  { id: 1, employee: 'Anita Rao', type: 'Annual', date: '2026-09-20', status: 'Pending' },
  { id: 2, employee: 'Farah Khan', type: 'Sick', date: '2026-09-08', status: 'Approved' },
];

export default function App() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeRole, setActiveRole] = useState<Role>('Manager');
  const [activeModule, setActiveModule] = useState<ModuleKey>('hub');

  const [observations, setObservations] = useState<Observation[]>(initialObservations);
  const [selectedObservationId, setSelectedObservationId] = useState<number | null>(initialObservations[0].id);
  const [newObsTitle, setNewObsTitle] = useState('');
  const [newObsArea, setNewObsArea] = useState('');
  const [newObsAssignee, setNewObsAssignee] = useState('');
  const [newObsSeverity, setNewObsSeverity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [photoNoteDraft, setPhotoNoteDraft] = useState('');
  const [appealReason, setAppealReason] = useState('');
  const [appealEvidence, setAppealEvidence] = useState('');

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [leaveTypeDraft, setLeaveTypeDraft] = useState<LeaveType>('Annual');
  const [leaveDateDraft, setLeaveDateDraft] = useState('2026-09-15');

  const [notifications, setNotifications] = useState<string[]>([
    'Safety observation #1 moved to In Progress.',
    'Afternoon shift attendance window opens at 11:45.',
    'Weekly executive report is ready to export.',
  ]);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const allowedModules = roleModules[activeRole];
  const selectedObservation = observations.find((item) => item.id === selectedObservationId) ?? null;

  const safetyCounts = useMemo(() => {
    return observations.reduce<Record<string, number>>((acc, observation) => {
      acc[observation.status] = (acc[observation.status] ?? 0) + 1;
      return acc;
    }, {});
  }, [observations]);

  const attendanceRate = useMemo(() => {
    if (!attendance.length) {
      return 0;
    }
    const checked = attendance.filter((entry) => entry.checkedIn).length;
    return Math.round((checked / attendance.length) * 100);
  }, [attendance]);

  const setModule = (module: ModuleKey) => {
    if (allowedModules.includes(module)) {
      setActiveModule(module);
    }
  };

  const createObservation = () => {
    if (!newObsTitle.trim() || !newObsArea.trim() || !newObsAssignee.trim()) {
      return;
    }
    const next: Observation = {
      id: Date.now(),
      title: newObsTitle.trim(),
      area: newObsArea.trim(),
      assignee: newObsAssignee.trim(),
      severity: newObsSeverity,
      status: 'Draft',
      photoNote: photoNoteDraft.trim() || undefined,
      appeals: [],
    };
    setObservations((prev) => [next, ...prev]);
    setSelectedObservationId(next.id);
    setNotifications((prev) => [`New safety draft created: ${next.title}`, ...prev]);
    setNewObsTitle('');
    setNewObsArea('');
    setNewObsAssignee('');
    setPhotoNoteDraft('');
  };

  const transitionObservation = (id: number, targetStatus: ObservationStatus) => {
    setObservations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: targetStatus } : item)),
    );
    setNotifications((prev) => [`Observation #${id} moved to ${targetStatus}.`, ...prev]);
  };

  const addAppeal = () => {
    if (!selectedObservation || !appealReason.trim() || !appealEvidence.trim()) {
      return;
    }
    setObservations((prev) =>
      prev.map((item) =>
        item.id === selectedObservation.id
          ? {
              ...item,
              appeals: [
                ...item.appeals,
                { reason: appealReason.trim(), evidence: appealEvidence.trim() },
              ],
              status: item.status === 'Closed' ? 'Reopened' : item.status,
            }
          : item,
      ),
    );
    setNotifications((prev) => [`Appeal submitted on observation #${selectedObservation.id}.`, ...prev]);
    setAppealReason('');
    setAppealEvidence('');
  };

  const nextStatus = (status: ObservationStatus): ObservationStatus | null => {
    if (status === 'Reopened') {
      return 'Open';
    }
    const index = statusFlow.indexOf(status);
    if (index < 0 || index === statusFlow.length - 1) {
      return null;
    }
    return statusFlow[index + 1];
  };

  const checkInEmployee = (employee: string) => {
    setAttendance((prev) =>
      prev.map((row) => (row.employee === employee ? { ...row, checkedIn: true } : row)),
    );
    setNotifications((prev) => [`${employee} checked in successfully.`, ...prev]);
  };

  const createLeaveRequest = () => {
    const next: LeaveRequest = {
      id: Date.now(),
      employee: 'Current User',
      type: leaveTypeDraft,
      date: leaveDateDraft,
      status: 'Pending',
    };
    setLeaveRequests((prev) => [next, ...prev]);
    setNotifications((prev) => [`Leave request submitted (${next.type}).`, ...prev]);
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.authRoot}>
        <StatusBar style="dark" />
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>Industrial Ops Hub</Text>
          <Text style={styles.authSubtitle}>
            Unified safety + workforce operations for mobile and web.
          </Text>
          <Text style={styles.label}>Demo sign-in role</Text>
          <View style={styles.roleWrap}>
            {ROLES.map((role) => (
              <Pressable
                key={role}
                onPress={() => setActiveRole(role)}
                style={[styles.choiceChip, activeRole === role && styles.choiceChipActive]}
              >
                <Text style={[styles.choiceChipText, activeRole === role && styles.choiceChipTextActive]}>
                  {role}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.primaryButton} onPress={() => setIsLoggedIn(true)}>
            <Text style={styles.primaryButtonText}>Enter Hub</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const renderHub = () => {
    return (
      <ScrollView contentContainerStyle={styles.screenContent}>
        <Text style={styles.heading}>Operations Hub</Text>
        <Text style={styles.subheading}>Choose a module to continue</Text>
        <View style={styles.cardGrid}>
          {[
            { key: 'safety' as const, title: 'Safety Observations', icon: '🪖' },
            { key: 'workforce' as const, title: 'Workforce & Attendance', icon: '📦' },
            { key: 'reports' as const, title: 'Reports', icon: '📊' },
            { key: 'settings' as const, title: 'Settings', icon: '⚙️' },
          ]
            .filter((module) => allowedModules.includes(module.key))
            .map((module) => (
              <Pressable
                key={module.key}
                style={styles.moduleCard}
                onPress={() => setModule(module.key)}
              >
                <View style={styles.iconOrb}>
                  <View style={styles.iconLayerBack} />
                  <View style={styles.iconLayerFront}>
                    <Text style={styles.iconGlyph}>{module.icon}</Text>
                  </View>
                </View>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleDescription}>{moduleDescriptions[module.key]}</Text>
              </Pressable>
            ))}
        </View>
      </ScrollView>
    );
  };

  const renderSafety = () => {
    return (
      <ScrollView contentContainerStyle={styles.screenContent}>
        <Text style={styles.heading}>Safety Observations</Text>
        <Text style={styles.subheading}>Capture, assign, and close out observations</Text>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Safety Dashboard</Text>
          {Object.entries(safetyCounts).map(([status, count]) => (
            <View key={status} style={styles.chartRow}>
              <Text style={styles.chartLabel}>{status}</Text>
              <View style={styles.chartTrack}>
                <View style={[styles.chartFill, { width: `${Math.min(count * 24, 100)}%` }]} />
              </View>
              <Text style={styles.chartValue}>{count}</Text>
            </View>
          ))}
        </View>

        <View style={styles.twoColWrap}>
          <View style={[styles.panel, styles.flexOne]}>
            <Text style={styles.panelTitle}>New Observation</Text>
            <TextInput
              placeholder="Title"
              style={styles.input}
              value={newObsTitle}
              onChangeText={setNewObsTitle}
            />
            <TextInput
              placeholder="Area"
              style={styles.input}
              value={newObsArea}
              onChangeText={setNewObsArea}
            />
            <TextInput
              placeholder="Assignee"
              style={styles.input}
              value={newObsAssignee}
              onChangeText={setNewObsAssignee}
            />
            <View style={styles.inlineWrap}>
              {(['Low', 'Medium', 'High'] as const).map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setNewObsSeverity(level)}
                  style={[
                    styles.choiceChip,
                    newObsSeverity === level && styles.choiceChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceChipText,
                      newObsSeverity === level && styles.choiceChipTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              placeholder="Photo note / attachment reference"
              style={styles.input}
              value={photoNoteDraft}
              onChangeText={setPhotoNoteDraft}
            />
            <Pressable style={styles.primaryButton} onPress={createObservation}>
              <Text style={styles.primaryButtonText}>Create Draft</Text>
            </Pressable>
          </View>

          <View style={[styles.panel, styles.flexOne]}>
            <Text style={styles.panelTitle}>Observation List</Text>
            {observations.length ? (
              observations.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedObservationId(item.id)}
                  style={[
                    styles.listRow,
                    selectedObservationId === item.id && styles.listRowSelected,
                  ]}
                >
                  <View>
                    <Text style={styles.listRowTitle}>{item.title}</Text>
                    <Text style={styles.listRowMeta}>
                      {item.area} • {item.severity}
                    </Text>
                  </View>
                  <Text style={styles.badge}>{item.status}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyState}>No observations yet. Create one to get started.</Text>
            )}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Observation Detail</Text>
          {!selectedObservation ? (
            <Text style={styles.emptyState}>Pick an observation to see lifecycle controls.</Text>
          ) : (
            <>
              <Text style={styles.detailTitle}>{selectedObservation.title}</Text>
              <Text style={styles.listRowMeta}>
                {selectedObservation.area} • Assignee: {selectedObservation.assignee}
              </Text>
              <Text style={styles.listRowMeta}>Status: {selectedObservation.status}</Text>
              {selectedObservation.photoNote ? (
                <Text style={styles.photoNote}>📎 {selectedObservation.photoNote}</Text>
              ) : (
                <Text style={styles.emptyState}>No photo attached yet.</Text>
              )}
              <View style={styles.inlineWrap}>
                {nextStatus(selectedObservation.status) ? (
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => {
                      const target = nextStatus(selectedObservation.status);
                      if (target) {
                        transitionObservation(selectedObservation.id, target);
                      }
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Move to {nextStatus(selectedObservation.status)}
                    </Text>
                  </Pressable>
                ) : null}
                {selectedObservation.status === 'Closed' ? (
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => transitionObservation(selectedObservation.id, 'Reopened')}
                  >
                    <Text style={styles.secondaryButtonText}>Reopen</Text>
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.panelTitle}>Appeals</Text>
              {selectedObservation.appeals.length ? (
                selectedObservation.appeals.map((appeal, index) => (
                  <View key={`${selectedObservation.id}-${index}`} style={styles.appealCard}>
                    <Text style={styles.listRowTitle}>{appeal.reason}</Text>
                    <Text style={styles.listRowMeta}>{appeal.evidence}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyState}>No appeals yet.</Text>
              )}
              <TextInput
                placeholder="Appeal reason"
                style={styles.input}
                value={appealReason}
                onChangeText={setAppealReason}
              />
              <TextInput
                placeholder="Evidence reference"
                style={styles.input}
                value={appealEvidence}
                onChangeText={setAppealEvidence}
              />
              <Pressable style={styles.primaryButton} onPress={addAppeal}>
                <Text style={styles.primaryButtonText}>Submit Appeal</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderWorkforce = () => {
    return (
      <ScrollView contentContainerStyle={styles.screenContent}>
        <Text style={styles.heading}>Workforce & Attendance</Text>
        <Text style={styles.subheading}>Plan shifts, missions, check-ins, and leave</Text>

        <View style={styles.twoColWrap}>
          <View style={[styles.panel, styles.flexOne]}>
            <Text style={styles.panelTitle}>Week Schedule</Text>
            {attendance.map((entry) => (
              <View key={`${entry.employee}-${entry.date}`} style={styles.scheduleCard}>
                <View
                  style={[styles.shiftAccent, { backgroundColor: shiftColors[entry.shift] }]}
                />
                <View style={styles.flexOne}>
                  <Text style={styles.listRowTitle}>
                    {entry.date} • {entry.shift} ({entry.employee})
                  </Text>
                  <Text style={styles.listRowMeta}>{entry.mission}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.panel, styles.flexOne]}>
            <Text style={styles.panelTitle}>Attendance Check-In</Text>
            <Text style={styles.metricTile}>Current attendance rate: {attendanceRate}%</Text>
            {attendance.map((entry) => (
              <View key={`check-${entry.employee}`} style={styles.listRow}>
                <View>
                  <Text style={styles.listRowTitle}>{entry.employee}</Text>
                  <Text style={styles.listRowMeta}>
                    {entry.shift} shift • {entry.mission}
                  </Text>
                </View>
                <Pressable
                  disabled={entry.checkedIn}
                  style={[styles.secondaryButton, entry.checkedIn && styles.disabledButton]}
                  onPress={() => checkInEmployee(entry.employee)}
                >
                  <Text style={styles.secondaryButtonText}>
                    {entry.checkedIn ? 'Checked In' : 'Check In'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Leave Requests</Text>
          <View style={styles.inlineWrap}>
            {(['Annual', 'Sick', 'Comp-Off', 'Emergency'] as const).map((item) => (
              <Pressable
                key={item}
                onPress={() => setLeaveTypeDraft(item)}
                style={[styles.choiceChip, leaveTypeDraft === item && styles.choiceChipActive]}
              >
                <Text style={[styles.choiceChipText, leaveTypeDraft === item && styles.choiceChipTextActive]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput value={leaveDateDraft} onChangeText={setLeaveDateDraft} style={styles.input} />
          <Pressable style={styles.primaryButton} onPress={createLeaveRequest}>
            <Text style={styles.primaryButtonText}>Request Leave</Text>
          </Pressable>
          {leaveRequests.map((request) => (
            <View key={request.id} style={styles.listRow}>
              <View>
                <Text style={styles.listRowTitle}>
                  {request.employee} • {request.type}
                </Text>
                <Text style={styles.listRowMeta}>{request.date}</Text>
              </View>
              <Text style={styles.badge}>{request.status}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderReports = () => {
    return (
      <ScrollView contentContainerStyle={styles.screenContent}>
        <Text style={styles.heading}>Reports</Text>
        <Text style={styles.subheading}>Executive and safety reporting hooks</Text>
        <View style={styles.twoColWrap}>
          <View style={[styles.panel, styles.flexOne]}>
            <Text style={styles.panelTitle}>Snapshot</Text>
            <Text style={styles.metricTile}>Open safety observations: {safetyCounts.Open ?? 0}</Text>
            <Text style={styles.metricTile}>In progress observations: {safetyCounts['In Progress'] ?? 0}</Text>
            <Text style={styles.metricTile}>Attendance rate: {attendanceRate}%</Text>
          </View>
          <View style={[styles.panel, styles.flexOne]}>
            <Text style={styles.panelTitle}>Export Hooks</Text>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Generate PDF (hook)</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Generate Excel (hook)</Text>
            </Pressable>
            <Text style={styles.listRowMeta}>
              Connect these actions to backend jobs when Supabase secrets are configured.
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderSettings = () => {
    return (
      <ScrollView contentContainerStyle={styles.screenContent}>
        <Text style={styles.heading}>Settings</Text>
        <Text style={styles.subheading}>Role, alerts, and personalization</Text>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Current role</Text>
          <Text style={styles.metricTile}>{activeRole}</Text>
          <View style={styles.listRow}>
            <Text style={styles.listRowTitle}>Email notifications</Text>
            <Switch value={emailAlerts} onValueChange={setEmailAlerts} />
          </View>
          <Text style={styles.panelTitle}>Recent notifications</Text>
          {notifications.length ? (
            notifications.slice(0, 6).map((note, index) => (
              <View key={`${note}-${index}`} style={styles.notificationCard}>
                <Text style={styles.listRowMeta}>{note}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyState}>No notifications yet.</Text>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderContent = () => {
    if (activeModule === 'hub') {
      return renderHub();
    }
    if (activeModule === 'safety') {
      return renderSafety();
    }
    if (activeModule === 'workforce') {
      return renderWorkforce();
    }
    if (activeModule === 'reports') {
      return renderReports();
    }
    return renderSettings();
  };

  const visibleNav = navItems.filter((item) => allowedModules.includes(item.key));

  return (
    <SafeAreaView style={styles.appRoot}>
      <StatusBar style="dark" />
      <View style={styles.shell}>
        {isDesktop ? (
          <View style={styles.sidebar}>
            <Text style={styles.sidebarTitle}>Industrial Ops Hub</Text>
            {visibleNav.map((item) => (
              <Pressable
                key={item.key}
                style={[styles.navButton, activeModule === item.key && styles.navButtonActive]}
                onPress={() => setModule(item.key)}
              >
                <Text style={styles.navText}>{item.label}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.logoutButton} onPress={() => setIsLoggedIn(false)}>
              <Text style={styles.logoutText}>Sign out</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.mainPane}>{renderContent()}</View>
      </View>

      {!isDesktop ? (
        <View style={styles.bottomNav}>
          {visibleNav.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setModule(item.key)}
              style={[styles.bottomNavButton, activeModule === item.key && styles.bottomNavButtonActive]}
            >
              <Text style={styles.bottomNavLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  shell: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E6EBF2',
    padding: 20,
    gap: 10,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#121826',
    marginBottom: 16,
  },
  navButton: {
    backgroundColor: '#F2F5FA',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  navButtonActive: {
    backgroundColor: '#DCE8FF',
  },
  navText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C2742',
  },
  logoutButton: {
    marginTop: 'auto',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D8DEE9',
  },
  logoutText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#4D5B76',
  },
  mainPane: {
    flex: 1,
  },
  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 90,
    gap: 16,
  },
  heading: {
    fontSize: 29,
    fontWeight: '800',
    color: '#121826',
  },
  subheading: {
    fontSize: 15,
    color: '#5D6B84',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    minHeight: 185,
    width: 300,
    shadowColor: '#0F1B2D',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    borderWidth: 1,
    borderColor: '#EBF0F7',
    gap: 12,
  },
  iconOrb: {
    height: 62,
    width: 62,
    position: 'relative',
  },
  iconLayerBack: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#BFD1FF',
    left: 6,
    top: 6,
  },
  iconLayerFront: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#EFF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGlyph: {
    fontSize: 26,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111727',
  },
  moduleDescription: {
    color: '#5D6B84',
    lineHeight: 21,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderColor: '#E6ECF4',
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D2740',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartLabel: {
    width: 95,
    color: '#4C5C77',
    fontSize: 13,
  },
  chartTrack: {
    flex: 1,
    backgroundColor: '#ECF1FA',
    borderRadius: 999,
    overflow: 'hidden',
    height: 10,
  },
  chartFill: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#6190FF',
  },
  chartValue: {
    width: 22,
    textAlign: 'right',
    color: '#4C5C77',
  },
  twoColWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  flexOne: {
    flex: 1,
    minWidth: 300,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D8E0EE',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inlineWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D4DEED',
    backgroundColor: '#F8FAFF',
  },
  choiceChipActive: {
    borderColor: '#7CA2FF',
    backgroundColor: '#DCE8FF',
  },
  choiceChipText: {
    color: '#44516A',
    fontWeight: '600',
  },
  choiceChipTextActive: {
    color: '#1E3A8A',
  },
  primaryButton: {
    backgroundColor: '#2B62F5',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C9D6EC',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: '#F5F8FF',
  },
  secondaryButtonText: {
    fontWeight: '700',
    color: '#1F396A',
  },
  listRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F3',
    backgroundColor: '#FAFCFF',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  listRowSelected: {
    borderColor: '#86A8FF',
    backgroundColor: '#EEF4FF',
  },
  listRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E2A43',
  },
  listRowMeta: {
    fontSize: 13,
    color: '#5A6780',
  },
  badge: {
    backgroundColor: '#E4EDFF',
    color: '#28417A',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#172338',
  },
  photoNote: {
    fontSize: 13,
    color: '#30486F',
    backgroundColor: '#E9F0FF',
    borderRadius: 10,
    padding: 8,
  },
  appealCard: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DCE4F2',
    backgroundColor: '#F8FBFF',
    gap: 4,
  },
  scheduleCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#FCFDFF',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  shiftAccent: {
    width: 10,
  },
  metricTile: {
    backgroundColor: '#F3F7FF',
    borderRadius: 12,
    padding: 10,
    color: '#1D3666',
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.55,
  },
  notificationCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E9F4',
    backgroundColor: '#FAFCFF',
    padding: 10,
  },
  emptyState: {
    color: '#6B7A94',
    fontStyle: 'italic',
  },
  bottomNav: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E3EAF5',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  bottomNavButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#EEF3FF',
    paddingVertical: 10,
    alignItems: 'center',
  },
  bottomNavButtonActive: {
    backgroundColor: '#D4E2FF',
  },
  bottomNavLabel: {
    fontWeight: '600',
    color: '#1F3563',
    fontSize: 12,
  },
  authRoot: {
    flex: 1,
    backgroundColor: '#F4F7FC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  authCard: {
    width: '100%',
    maxWidth: 700,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5ECF7',
    gap: 12,
    shadowColor: '#19253B',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  authTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#141D2F',
  },
  authSubtitle: {
    color: '#5A6881',
    fontSize: 15,
    marginBottom: 6,
  },
  label: {
    fontWeight: '700',
    color: '#1C2D4C',
  },
  roleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
});
