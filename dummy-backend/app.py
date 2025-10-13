from flask import Flask, send_file, Response
from flask_cors import CORS, cross_origin
import os

app = Flask(__name__)
CORS(app)

@app.route('/calendar')
@cross_origin(origin='*')
def get_calendar():
    """Endpoint to return the iCal file content"""
    try:
        # Path to your iCal file - update with your actual path
        ical_path = 'wi24a3.ics'
        
        # Check if the file exists
        if not os.path.exists(ical_path):
            return Response("Calendar file not found", status=404)
        
        # Return the file with appropriate MIME type
        return send_file(
            ical_path,
            mimetype='text/calendar',
            as_attachment=True,
            download_name='wi24a3.ics'
        )
    except Exception as e:
        return Response(f"Error: {str(e)}", status=500)

@app.route('/')
def index():
    """Simple index page"""
    return 'iCal API is running. Access the calendar at /calendar'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)