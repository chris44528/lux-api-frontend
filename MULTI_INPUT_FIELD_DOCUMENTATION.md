# Multi-Input Field Documentation

## Overview
The Multi-Input field type allows form builders to create groups of related Yes/No questions with comment boxes. This is ideal for checklists, inspections, and assessments where multiple items need to be evaluated with the same response format.

## Frontend Implementation

### Field Configuration
When creating a multi-input field in the form builder:
- **Field Type**: `multi_input`
- **Label**: The main label for the field group
- **Questions**: Array of individual questions/items to check
- **Answer Type**: Currently fixed as `yes_no_comment`

### Data Structure

#### Form Schema Storage
```json
{
  "id": "field-123456",
  "type": "multi_input",
  "label": "Vehicle Safety Check",
  "name": "vehicle_check",
  "required": true,
  "multiInputConfig": {
    "questions": [
      "Engine oil level",
      "Coolant level",
      "Washer bottle level",
      "Tire pressure",
      "Brake fluid level"
    ],
    "answerType": "yes_no_comment"
  }
}
```

#### Submitted Data Format
```json
{
  "vehicle_check": {
    "0": {
      "answer": "yes",
      "comment": "Oil level is at maximum"
    },
    "1": {
      "answer": "no",
      "comment": "Coolant needs topping up - approximately 500ml low"
    },
    "2": {
      "answer": "yes",
      "comment": ""
    },
    "3": {
      "answer": "yes",
      "comment": "All tires at 32 PSI"
    },
    "4": {
      "answer": "no",
      "comment": "Brake fluid below minimum line, requires immediate attention"
    }
  }
}
```

## Validation Rules

1. **Required Fields**: When a multi-input field is marked as required, all questions must have an answer (Yes or No)
2. **Conditional Comments**: When "No" is selected, a comment is automatically required to provide details
3. **Optional Comments**: When "Yes" is selected, comments are optional

## Use Cases

### Vehicle Inspection
```
Field: Vehicle Safety Check
Questions:
- Engine oil level
- Coolant level  
- Washer bottle level
- Tire condition
- Lights functioning
```

### Property Inspection
```
Field: Property Condition Check
Questions:
- Windows secure
- Doors lock properly
- Heating system working
- No visible damage
- Smoke alarms present
```

### Equipment Check
```
Field: Equipment Status
Questions:
- Power tools charged
- Safety equipment present
- Tools in good condition
- First aid kit stocked
- PPE available
```

## Backend Compatibility

The backend uses flexible JSON storage (`JSONField`) for both form schemas and submitted data, so no backend changes are required. The nested object structure is automatically handled.

## Future Enhancements

1. **Additional Answer Types**:
   - `rating_comment` (1-5 scale with comment)
   - `pass_fail_comment` (Pass/Fail with comment)
   - `custom_options` (Custom radio options with comment)

2. **Conditional Logic**:
   - Show/hide questions based on other answers
   - Make certain questions required based on conditions

3. **Photo Attachments**:
   - Allow photo upload for each question when "No" is selected

4. **Templates**:
   - Pre-defined question sets for common inspection types

## Testing Recommendations

1. **Empty State**: Test with no questions added
2. **Single Question**: Test with just one question
3. **Many Questions**: Test with 10+ questions to ensure UI remains usable
4. **Validation**: Test required field validation and "No" answer comment requirement
5. **Data Persistence**: Ensure data saves correctly and can be edited
6. **Mobile View**: Test responsive behavior on mobile devices