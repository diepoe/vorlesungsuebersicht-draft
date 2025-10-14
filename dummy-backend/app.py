from flask import Flask, send_file, Response, request
from flask_cors import CORS, cross_origin
import os

app = Flask(__name__)
CORS(app)

@app.route('/calendar')
@cross_origin(origin='*')
def get_calendar():
    """Endpoint to return the iCal file content based on course parameter"""
    try:
        # Get course parameter from URL
        course = request.args.get('course', 'wi24a3').lower()
        
        # Map course codes to file names
        course_files = {
            'wi25a3': 'wi25a3.ics',
            'wi24a3': 'wi24a3.ics',
            'wi24a2': 'wi24a2.ics'
        }
        
        # Get the corresponding file path
        if course in course_files:
            ical_path = course_files[course]
        else:
            return Response(f"Course '{course}' not found. Available courses: {', '.join(course_files.keys())}", status=404)
        
        # Check if the file exists
        if not os.path.exists(ical_path):
            return Response(f"Calendar file for course '{course}' not found", status=404)
        
        # Return the file with appropriate MIME type
        return send_file(
            ical_path,
            mimetype='text/calendar',
            as_attachment=True,
            download_name=f'{course}.ics'
        )
    except Exception as e:
        return Response(f"Error: {str(e)}", status=500)

@app.route('/')
def index():
    """Simple index page with usage information"""
    return '''
    <h1>iCal API</h1>
    <p>Access calendars at: <code>/calendar?course=&lt;course_code&gt;</code></p>
    <h3>Available courses:</h3>
    <ul>
        <li><a href="/calendar?course=wi24a3">wi24a3</a> (default)</li>
        <li><a href="/calendar?course=wi22b1">wi22b1</a></li>
        <li><a href="/calendar?course=wi23a2">wi23a2</a></li>
    </ul>
    <p>If no course parameter is provided, wi24a3 will be used as default.</p>
    '''

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)