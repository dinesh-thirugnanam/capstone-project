import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../utils/constants';

const OfficeCard = ({ office, onEdit, onDelete, showActions = true }) => {
  const handleDelete = () => {
    Alert.alert(
      'Delete Office',
      `Are you sure you want to delete "${office.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete && onDelete(office._id || office.id),
        },
      ]
    );
  };

  const handleEdit = () => {
    onEdit && onEdit(office);
  };

  const formatCoordinates = (lat, lng) => {
    return `${lat?.toFixed(6)}, ${lng?.toFixed(6)}`;
  };

  const formatWorkingHours = (hours) => {
    if (!hours) return 'Not set';
    return `${hours.start} - ${hours.end}`;
  };

  const formatWorkingDays = (days) => {
    if (!days || days.length === 0) return 'Not set';
    if (days.length === 7) return 'All days';
    return days.join(', ');
  };

  const coordinates = office.location?.coordinates || [
    office.centerLongitude || 0,
    office.centerLatitude || 0
  ];
  const latitude = coordinates[1] || office.centerLatitude;
  const longitude = coordinates[0] || office.centerLongitude;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>🏢 {office.name}</Text>
          <Text style={styles.id}>ID: {office._id || office.id}</Text>
        </View>
        
        {showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <Text style={styles.editButtonText}>✏️</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* Location Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location</Text>
          <Text style={styles.address}>
            {office.officeInfo?.address || 'No address provided'}
          </Text>
          <Text style={styles.coordinates}>
            {formatCoordinates(latitude, longitude)}
          </Text>
          <Text style={styles.radius}>
            Radius: {office.radius || 100}m
          </Text>
        </View>

        {/* Working Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕒 Working Hours</Text>
          <Text style={styles.workingHours}>
            {formatWorkingHours(office.officeInfo?.workingHours)}
          </Text>
          <Text style={styles.workingDays}>
            Days: {formatWorkingDays(office.officeInfo?.workingDays)}
          </Text>
        </View>

        {/* Status */}
        <View style={styles.statusSection}>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: office.isActive !== false ? COLORS.success : COLORS.error }
          ]} />
          <Text style={styles.statusText}>
            {office.isActive !== false ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Timestamps */}
      <View style={styles.footer}>
        <Text style={styles.timestamp}>
          Created: {new Date(office.createdAt).toLocaleDateString()}
        </Text>
        {office.updatedAt && office.updatedAt !== office.createdAt && (
          <Text style={styles.timestamp}>
            Updated: {new Date(office.updatedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  id: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginLeft: 4,
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  content: {
    marginBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  address: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  radius: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  workingHours: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  workingDays: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
});

export default OfficeCard;
