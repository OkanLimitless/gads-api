import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Trash2, Edit, Plus, Calendar, Settings } from 'lucide-react'

interface AdScheduleTemplate {
  id: string
  name: string
  description: string
  schedule: {
    dayOfWeek: string // MONDAY, TUESDAY, etc.
    startHour: number // 0-23
    startMinute: number // 0, 15, 30, 45
    endHour: number // 0-23
    endMinute: number // 0, 15, 30, 45
    bidModifier?: number // -90 to 900 (percentage)
  }[]
  createdAt: string
  updatedAt: string
}

interface AdScheduleManagerProps {
  templates: AdScheduleTemplate[]
  onSaveTemplates: (templates: AdScheduleTemplate[]) => void
  onClose: () => void
}

const DAYS_OF_WEEK = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
]

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 15, 30, 45]

export default function AdScheduleManager({ templates, onSaveTemplates, onClose }: AdScheduleManagerProps) {
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    schedule: [] as AdScheduleTemplate['schedule']
  })

  const deleteTemplate = (templateId: string) => {
    const newTemplates = templates.filter(t => t.id !== templateId)
    onSaveTemplates(newTemplates)
  }

  const createTemplate = () => {
    if (!newTemplate.name.trim()) return

    const template: AdScheduleTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      description: newTemplate.description,
      schedule: newTemplate.schedule,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    onSaveTemplates([...templates, template])
    setNewTemplate({ name: '', description: '', schedule: [] })
    setShowCreateForm(false)
  }

  const addScheduleSlot = () => {
    setNewTemplate(prev => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        {
          dayOfWeek: 'MONDAY',
          startHour: 9,
          startMinute: 0,
          endHour: 17,
          endMinute: 0,
          bidModifier: 0
        }
      ]
    }))
  }

  const updateScheduleSlot = (index: number, field: string, value: any) => {
    setNewTemplate(prev => ({
      ...prev,
      schedule: prev.schedule.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }))
  }

  const removeScheduleSlot = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }))
  }

  const formatTime = (hour: number, minute: number) => {
    const h = hour.toString().padStart(2, '0')
    const m = minute.toString().padStart(2, '0')
    return `${h}:${m}`
  }

  const getPresetTemplates = () => {
    return [
      {
        name: 'Business Hours',
        description: 'Monday to Friday, 9 AM to 5 PM',
        schedule: DAYS_OF_WEEK.slice(0, 5).map(day => ({
          dayOfWeek: day,
          startHour: 9,
          startMinute: 0,
          endHour: 17,
          endMinute: 0,
          bidModifier: 0
        }))
      },
      {
        name: 'Weekends Only',
        description: 'Saturday and Sunday, all day',
        schedule: ['SATURDAY', 'SUNDAY'].map(day => ({
          dayOfWeek: day,
          startHour: 0,
          startMinute: 0,
          endHour: 23,
          endMinute: 45,
          bidModifier: 0
        }))
      },
      {
        name: 'Evening Rush',
        description: 'Weekdays 5 PM to 9 PM with +50% bid modifier',
        schedule: DAYS_OF_WEEK.slice(0, 5).map(day => ({
          dayOfWeek: day,
          startHour: 17,
          startMinute: 0,
          endHour: 21,
          endMinute: 0,
          bidModifier: 50
        }))
      }
    ]
  }

  const usePreset = (preset: any) => {
    setNewTemplate(prev => ({
      ...prev,
      name: preset.name,
      description: preset.description,
      schedule: preset.schedule
    }))
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <Clock className="h-6 w-6 mr-2 text-blue-600" />
                Ad Schedule Templates
              </CardTitle>
              <CardDescription>
                Create and manage ad scheduling templates for your campaigns
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
              <Button variant="outline" onClick={onClose}>
                Back to Campaign Creation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Create New Ad Schedule Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="templateName">Template Name *</Label>
                    <Input
                      id="templateName"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Business Hours"
                    />
                  </div>
                  <div>
                    <Label htmlFor="templateDescription">Description</Label>
                    <Input
                      id="templateDescription"
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g., Monday to Friday, 9 AM to 5 PM"
                    />
                  </div>
                </div>

                <div>
                  <Label>Quick Presets</Label>
                  <div className="flex gap-2 mt-2">
                    {getPresetTemplates().map((preset, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => usePreset(preset)}
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label>Schedule Slots</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addScheduleSlot}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Slot
                    </Button>
                  </div>
                  
                  {newTemplate.schedule.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No schedule slots added yet</p>
                      <p className="text-sm">Click "Add Slot" to create your first time slot</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-3">
                      {newTemplate.schedule.map((slot, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="grid grid-cols-6 gap-3 items-end">
                            <div>
                              <Label>Day</Label>
                              <Select 
                                value={slot.dayOfWeek} 
                                onValueChange={(value) => updateScheduleSlot(index, 'dayOfWeek', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DAYS_OF_WEEK.map(day => (
                                    <SelectItem key={day} value={day}>
                                      {day.charAt(0) + day.slice(1).toLowerCase()}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Start</Label>
                              <div className="flex gap-1">
                                <Select 
                                  value={slot.startHour.toString()} 
                                  onValueChange={(value) => updateScheduleSlot(index, 'startHour', parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {HOURS.map(hour => (
                                      <SelectItem key={hour} value={hour.toString()}>
                                        {hour.toString().padStart(2, '0')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select 
                                  value={slot.startMinute.toString()} 
                                  onValueChange={(value) => updateScheduleSlot(index, 'startMinute', parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {MINUTES.map(minute => (
                                      <SelectItem key={minute} value={minute.toString()}>
                                        {minute.toString().padStart(2, '0')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label>End</Label>
                              <div className="flex gap-1">
                                <Select 
                                  value={slot.endHour.toString()} 
                                  onValueChange={(value) => updateScheduleSlot(index, 'endHour', parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {HOURS.map(hour => (
                                      <SelectItem key={hour} value={hour.toString()}>
                                        {hour.toString().padStart(2, '0')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select 
                                  value={slot.endMinute.toString()} 
                                  onValueChange={(value) => updateScheduleSlot(index, 'endMinute', parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {MINUTES.map(minute => (
                                      <SelectItem key={minute} value={minute.toString()}>
                                        {minute.toString().padStart(2, '0')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label>Bid Modifier (%)</Label>
                              <Input
                                type="number"
                                min="-90"
                                max="900"
                                value={slot.bidModifier || 0}
                                onChange={(e) => updateScheduleSlot(index, 'bidModifier', parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeScheduleSlot(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            {slot.dayOfWeek.charAt(0) + slot.dayOfWeek.slice(1).toLowerCase()} {formatTime(slot.startHour, slot.startMinute)} - {formatTime(slot.endHour, slot.endMinute)}
                            {slot.bidModifier !== 0 && (
                              <span className={`ml-2 ${slot.bidModifier > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ({slot.bidModifier > 0 ? '+' : ''}{slot.bidModifier}% bid)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={createTemplate} disabled={!newTemplate.name.trim()}>
                    Create Template
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {templates.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ad schedule templates yet</h3>
              <p className="text-gray-600 mb-4">Create your first template to schedule when your ads should show</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <div className="flex items-center mb-2">
                        <Calendar className="h-4 w-4 mr-1 text-blue-600" />
                        <span className="font-medium">{template.schedule.length} time slots</span>
                      </div>
                      <div className="space-y-1">
                        {template.schedule.slice(0, 3).map((slot, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            {slot.dayOfWeek.charAt(0) + slot.dayOfWeek.slice(1).toLowerCase()} {formatTime(slot.startHour, slot.startMinute)}-{formatTime(slot.endHour, slot.endMinute)}
                            {slot.bidModifier !== 0 && (
                              <span className={`ml-1 ${slot.bidModifier > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ({slot.bidModifier > 0 ? '+' : ''}{slot.bidModifier}%)
                              </span>
                            )}
                          </div>
                        ))}
                        {template.schedule.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{template.schedule.length - 3} more slots...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700 flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}